/**
 * Image Preprocessor for MobileCLIP
 * Resizes to 256x256, applies CLIP normalization, returns CHW format Float32Array
 */

import * as ImageManipulator from 'expo-image-manipulator';

// CLIP normalization constants
const CLIP_MEAN = [0.48145466, 0.4578275, 0.40821073];
const CLIP_STD = [0.26862954, 0.26130258, 0.27577711];

export interface PreprocessedImage {
  data: Float32Array; // [3, 256, 256] CHW format
  width: number;
  height: number;
}

/**
 * Preprocess image for MobileCLIP inference
 * @param imageUri Local image URI (file://)
 * @returns Preprocessed image data in CHW format
 */
export async function preprocessImage(imageUri: string): Promise<PreprocessedImage> {
  // Step 1: Resize to 256x256
  const manipulated = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 256, height: 256 } }],
    { format: ImageManipulator.SaveFormat.PNG }
  );

  // Step 2: Load pixel data
  const pixelData = await loadPixelData(manipulated.uri);

  // Step 3: Normalize and convert to CHW
  const normalized = normalizeToCHW(pixelData);

  return {
    data: normalized,
    width: 256,
    height: 256,
  };
}

/**
 * Load raw RGBA pixel data from image
 */
async function loadPixelData(uri: string): Promise<Uint8ClampedArray> {
  // In React Native, we need to read the image file and decode
  // For now, we'll create a canvas-like approach using expo-image-manipulator's base64

  const manipulated = await ImageManipulator.manipulateAsync(uri, [], {
    format: ImageManipulator.SaveFormat.PNG,
    base64: true,
  });

  if (!manipulated.base64) {
    throw new Error('Failed to get base64 image data');
  }

  // Decode base64 to binary
  const binary = atob(manipulated.base64);
  const bytes = new Uint8ClampedArray(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  // Parse PNG (simplified - assumes 256x256 RGBA)
  // In production, use a proper PNG decoder library
  // For now, return dummy data that represents the expected format
  return bytes;
}

/**
 * Convert RGBA pixel data to normalized CHW format
 */
function normalizeToCHW(rgbaData: Uint8ClampedArray): Float32Array {
  const size = 256 * 256;
  const chw = new Float32Array(3 * size);

  // Extract RGB and normalize
  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const pixelIndex = (y * 256 + x) * 4; // RGBA
      const channelIndex = y * 256 + x;

      // R channel (index 0)
      const r = rgbaData[pixelIndex] / 255.0;
      chw[channelIndex] = (r - CLIP_MEAN[0]) / CLIP_STD[0];

      // G channel (index 1)
      const g = rgbaData[pixelIndex + 1] / 255.0;
      chw[size + channelIndex] = (g - CLIP_MEAN[1]) / CLIP_STD[1];

      // B channel (index 2)
      const b = rgbaData[pixelIndex + 2] / 255.0;
      chw[2 * size + channelIndex] = (b - CLIP_MEAN[2]) / CLIP_STD[2];
    }
  }

  return chw;
}

/**
 * Normalize embedding vector to unit length
 */
export function normalizeEmbedding(embedding: number[]): number[] {
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) return embedding;
  return embedding.map(val => val / magnitude);
}
