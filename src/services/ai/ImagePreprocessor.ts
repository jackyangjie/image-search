/**
 * @fileoverview 图像预处理模块
 * @description 将图像转换为模型输入格式 (CHW float32 tensor)
 *
 * 使用 pako 库进行 zlib 解压，替代之前有缺陷的手工 deflate 实现。
 * 只支持 PNG RGBA (colorType=6) 和 RGB (colorType=2) 格式。
 */

import { inflate } from 'pako';
import * as ImageManipulator from 'expo-image-manipulator';

const CLIP_MEAN = [0.48145466, 0.4578275, 0.40821073];
const CLIP_STD = [0.26862954, 0.26130258, 0.27577711];

export interface PreprocessedImage {
  data: Float32Array;
  width: number;
  height: number;
}

/**
 * 将图片 URI 转换为模型输入的 CHW Float32Array
 * 使用 expo-image-manipulator 缩放到 224x224，输出 PNG base64，然后解码像素数据
 */
export async function preprocessImage(imageUri: string): Promise<PreprocessedImage> {
  const manipulated = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 224, height: 224 } }],
    { format: ImageManipulator.SaveFormat.PNG, base64: true }
  );

  if (!manipulated.base64) {
    throw new Error('Failed to get base64 image data');
  }

  const pixelData = decodeBase64Png(manipulated.base64);
  const normalized = normalizeToCHW(pixelData);

  return {
    data: normalized,
    width: 224,
    height: 224,
  };
}

/**
 * 解码 base64 编码的 PNG 图片为 RGBA 像素数据
 */
function decodeBase64Png(base64: string): Uint8ClampedArray {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  if (!isPngSignature(bytes)) {
    throw new Error('Invalid PNG file');
  }

  const chunks = parsePngChunks(bytes);
  const ihdr = chunks.ihdr;
  if (!ihdr) {
    throw new Error('PNG missing IHDR chunk');
  }
  if (chunks.idat.length === 0) {
    throw new Error('PNG missing IDAT chunks');
  }

  const { width, height, bitDepth, colorType } = ihdr;

  if (bitDepth !== 8) {
    throw new Error(`Unsupported PNG bit depth: ${bitDepth}. Only 8-bit is supported.`);
  }
  if (colorType !== 6 && colorType !== 2) {
    throw new Error(`Unsupported PNG color type: ${colorType}. Expected RGBA (6) or RGB (2).`);
  }

  // 合并所有 IDAT 数据块
  const totalIdatLength = chunks.idat.reduce((acc, chunk) => acc + chunk.length, 0);
  const combinedIdat = new Uint8Array(totalIdatLength);
  let offset = 0;
  for (const chunk of chunks.idat) {
    combinedIdat.set(chunk, offset);
    offset += chunk.length;
  }

  // 使用 pako 解压 zlib 数据
  const decompressed = inflate(combinedIdat);

  // 解码图像数据（含 filter 反向处理）
  const rgbaData = applyFilters(decompressed, width, height, colorType);

  return rgbaData;
}

interface PngIhdr {
  width: number;
  height: number;
  bitDepth: number;
  colorType: number;
}

interface PngChunks {
  ihdr: PngIhdr | null;
  idat: Uint8Array[];
}

/**
 * 解析 PNG chunk 结构
 */
function parsePngChunks(bytes: Uint8Array): PngChunks {
  const result: PngChunks = { ihdr: null, idat: [] };
  let pos = 8; // 跳过 PNG 签名

  while (pos < bytes.length) {
    const length =
      (bytes[pos] << 24) | (bytes[pos + 1] << 16) | (bytes[pos + 2] << 8) | bytes[pos + 3];
    const type = String.fromCharCode(
      bytes[pos + 4],
      bytes[pos + 5],
      bytes[pos + 6],
      bytes[pos + 7]
    );
    const data = bytes.slice(pos + 8, pos + 8 + length);

    if (type === 'IHDR') {
      result.ihdr = {
        width: (data[0] << 24) | (data[1] << 16) | (data[2] << 8) | data[3],
        height: (data[4] << 24) | (data[5] << 16) | (data[6] << 8) | data[7],
        bitDepth: data[8],
        colorType: data[9],
      };
    } else if (type === 'IDAT') {
      result.idat.push(data);
    } else if (type === 'IEND') {
      break;
    }

    pos += 12 + length; // 4 (length) + 4 (type) + length (data) + 4 (crc)
  }

  return result;
}

function isPngSignature(bytes: Uint8Array): boolean {
  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  return bytes.length >= 8 && pngSignature.every((b, i) => bytes[i] === b);
}

/**
 * 对 PNG 解压后的数据应用 filter 反转，得到最终像素值
 * PNG filter 类型: 0=None, 1=Sub, 2=Up, 3=Average, 4=Paeth
 */
function applyFilters(
  data: Uint8Array,
  width: number,
  height: number,
  colorType: number
): Uint8ClampedArray {
  const channels = colorType === 6 ? 4 : 3; // RGBA=6 or RGB=2
  const bytesPerPixel = channels;
  const rowBytes = width * bytesPerPixel;
  const output = new Uint8ClampedArray(width * height * 4); // 输出始终为 RGBA

  let inPos = 0;

  for (let y = 0; y < height; y++) {
    const filterType = data[inPos++];

    for (let x = 0; x < width; x++) {
      const outPos = (y * width + x) * 4;

      for (let c = 0; c < channels; c++) {
        const raw = data[inPos++];
        let value = raw;

        // 根据当前行 filter 类型还原像素值
        switch (filterType) {
          case 0: // None
            break;
          case 1: {
            // Sub: 左邻像素
            if (x > 0) {
              value = (raw + output[outPos - 4 + c]) & 0xff;
            }
            break;
          }
          case 2: {
            // Up: 上方像素
            if (y > 0) {
              value = (raw + output[outPos - width * 4 + c]) & 0xff;
            }
            break;
          }
          case 3: {
            // Average: (左+上)/2
            const left = x > 0 ? output[outPos - 4 + c] : 0;
            const up = y > 0 ? output[outPos - width * 4 + c] : 0;
            value = (raw + Math.floor((left + up) / 2)) & 0xff;
            break;
          }
          case 4: {
            // Paeth
            const left = x > 0 ? output[outPos - 4 + c] : 0;
            const up = y > 0 ? output[outPos - width * 4 + c] : 0;
            const leftUp = x > 0 && y > 0 ? output[outPos - width * 4 - 4 + c] : 0;
            value = (raw + paethPredictor(left, up, leftUp)) & 0xff;
            break;
          }
        }

        output[outPos + c] = value;
      }

      // RGB -> RGBA: 填充 alpha=255
      if (channels === 3) {
        output[outPos + 3] = 255;
      }
    }
  }

  return output;
}

function paethPredictor(left: number, up: number, leftUp: number): number {
  const p = left + up - leftUp;
  const pLeft = Math.abs(p - left);
  const pUp = Math.abs(p - up);
  const pLeftUp = Math.abs(p - leftUp);

  if (pLeft <= pUp && pLeft <= pLeftUp) {
    return left;
  } else if (pUp <= pLeftUp) {
    return up;
  } else {
    return leftUp;
  }
}

/**
 * 将 RGBA 像素数据转换为 CHW 格式（Channel-Height-Width）并做 CLIP 归一化
 */
function normalizeToCHW(rgbaData: Uint8ClampedArray): Float32Array {
  const size = 224 * 224;
  const chw = new Float32Array(3 * size);

  for (let y = 0; y < 224; y++) {
    for (let x = 0; x < 224; x++) {
      const pixelIndex = (y * 224 + x) * 4;
      const channelIndex = y * 224 + x;

      const r = rgbaData[pixelIndex] / 255.0;
      chw[channelIndex] = (r - CLIP_MEAN[0]) / CLIP_STD[0];

      const g = rgbaData[pixelIndex + 1] / 255.0;
      chw[size + channelIndex] = (g - CLIP_MEAN[1]) / CLIP_STD[1];

      const b = rgbaData[pixelIndex + 2] / 255.0;
      chw[2 * size + channelIndex] = (b - CLIP_MEAN[2]) / CLIP_STD[2];
    }
  }

  return chw;
}

export function normalizeEmbedding(embedding: number[]): number[] {
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return embedding;
  return embedding.map(val => val / magnitude);
}

/**
 * 从 base64 PNG 数据直接预处理（跳过文件读取）
 */
export async function preprocessImageFromBase64(base64Image: string): Promise<PreprocessedImage> {
  const pixelData = decodeBase64Png(base64Image);
  const normalized = normalizeToCHW(pixelData);

  return {
    data: normalized,
    width: 224,
    height: 224,
  };
}
