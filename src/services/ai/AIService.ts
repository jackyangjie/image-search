/**
 * AIService with ONNX Runtime for MobileCLIP
 * Real inference using mobileclip_s0_*.onnx models
 *
 * NOTE: Model files need to be placed in native assets directory before build:
 * - Android: android/app/src/main/assets/models/
 * - iOS: ios/<ProjectName>/models/
 */

import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import * as FileSystem from 'expo-file-system';
import { getTokenizer } from './CLIPTokenizer';
import { preprocessImage, normalizeEmbedding } from './ImagePreprocessor';

const VISION_MODEL_NAME = 'mobileclip_s0_image.onnx';
const TEXT_MODEL_NAME = 'mobileclip_s0_text.onnx';

// Model download URLs (fallback if local models not available)
const MODEL_BASE_URL = 'https://your-cdn.com/models/'; // Replace with your CDN

export class AIService {
  private static _instance: AIService | null = null;
  private _initialized: boolean = false;
  private _visionSession: InferenceSession | null = null;
  private _textSession: InferenceSession | null = null;
  private _useMock: boolean = true; // Fallback to mock if models unavailable

  static getInstance(): AIService {
    if (!AIService._instance) {
      AIService._instance = new AIService();
    }
    return AIService._instance;
  }

  async initialize(): Promise<void> {
    try {
      await this.loadModels();
      this._initialized = true;
      console.log('AI Service initialized (ONNX Runtime)');
    } catch (error) {
      console.warn('Failed to load ONNX models, falling back to mock:', error);
      this._useMock = true;
      this._initialized = true;
      console.log('AI Service initialized (Mock mode)');
    }
  }

  private async loadModels(): Promise<void> {
    // Try to load from native assets first
    const visionModelPath = await this.getModelPath(VISION_MODEL_NAME);
    const textModelPath = await this.getModelPath(TEXT_MODEL_NAME);

    if (!visionModelPath || !textModelPath) {
      throw new Error('MODELS_NOT_FOUND');
    }

    this._visionSession = await InferenceSession.create(visionModelPath, {
      executionProviders: ['cpu'],
      graphOptimizationLevel: 'all',
    });

    this._textSession = await InferenceSession.create(textModelPath, {
      executionProviders: ['cpu'],
      graphOptimizationLevel: 'all',
    });

    this._useMock = false;
  }

  private async getModelPath(modelName: string): Promise<string | null> {
    const cacheDir = FileSystem.Paths.cache.uri + 'models/';
    const cachePath = cacheDir + modelName;

    // Check if already cached
    const fileInfo = await FileSystem.getInfoAsync(cachePath);
    if (fileInfo.exists) {
      return cachePath;
    }

    // Try to find in native assets (Android: android/app/src/main/assets/)
    const possiblePaths = [
      // Android asset path
      `file:///android_asset/models/${modelName}`,
      // iOS bundle path
      `${FileSystem.Paths.bundle.uri}models/${modelName}`,
    ];

    for (const assetPath of possiblePaths) {
      const info = await FileSystem.getInfoAsync(assetPath);
      if (info.exists) {
        // Copy to cache for faster access
        await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
        await FileSystem.copyAsync({ from: assetPath, to: cachePath });
        return cachePath;
      }
    }

    return null;
  }

  isInitialized(): boolean {
    return this._initialized;
  }

  async encodeImage(imageUri: string): Promise<number[]> {
    if (!this._initialized) {
      throw new Error('AI_NOT_INITIALIZED');
    }

    if (this._useMock) {
      return this._mockEncodeImage(imageUri);
    }

    if (!this._visionSession) {
      throw new Error('VISION_MODEL_NOT_LOADED');
    }

    const preprocessed = await preprocessImage(imageUri);
    const inputTensor = new Tensor('float32', preprocessed.data, [1, 3, 256, 256]);
    const feeds = { image: inputTensor };
    const outputs = await this._visionSession.run(feeds);
    const embeddingTensor = outputs.image_features as Tensor;
    const embeddingArray = Array.from(embeddingTensor.data as Float32Array);
    return normalizeEmbedding(embeddingArray);
  }

  async encodeText(text: string): Promise<number[]> {
    if (!this._initialized) {
      throw new Error('AI_NOT_INITIALIZED');
    }

    if (this._useMock) {
      return this._mockEncodeText(text);
    }

    if (!this._textSession) {
      throw new Error('TEXT_MODEL_NOT_LOADED');
    }

    const tokenizer = getTokenizer();
    const tokenIds = tokenizer.encode(text);
    const inputTensor = new Tensor('int64', tokenIds, [1, 77]);
    const feeds = { text: inputTensor };
    const outputs = await this._textSession.run(feeds);
    const embeddingTensor = outputs.text_features as Tensor;
    const embeddingArray = Array.from(embeddingTensor.data as Float32Array);
    return normalizeEmbedding(embeddingArray);
  }

  private _mockEncodeImage(imageUri: string): number[] {
    const seed = this._hashToSeed(imageUri);
    return this._generateMockEmbedding(seed);
  }

  private _mockEncodeText(text: string): number[] {
    const seed = this._hashToSeed(text);
    return this._generateMockEmbedding(seed);
  }

  private _hashToSeed(input: string): number {
    let hash = 5381;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) + hash + input.charCodeAt(i)) & 0x7fffffff;
    }
    return hash;
  }

  private _generateMockEmbedding(seed: number): number[] {
    let s = seed || 1;
    const next = () => {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      return (s >>> 0) / 0xffffffff;
    };

    const embedding = new Array(512).fill(0).map((_, i) => {
      if (i < 200) {
        return 1.0 + (next() - 0.5) * 0.4;
      }
      return (next() - 0.5) * 2;
    });

    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }

  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same length');
    }
    let dotProduct = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
    }
    return dotProduct;
  }

  async warmUp(): Promise<void> {
    if (!this._initialized) {
      throw new Error('AI_NOT_INITIALIZED');
    }
    await this.encodeText('warmup');
  }

  async release(): Promise<void> {
    if (this._visionSession) {
      await this._visionSession.release();
      this._visionSession = null;
    }
    if (this._textSession) {
      await this._textSession.release();
      this._textSession = null;
    }
    this._initialized = false;
    this._useMock = true;
  }
}
