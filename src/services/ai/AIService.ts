import { Platform } from 'react-native';
import { File, Directory, Paths } from 'expo-file-system';
import { getBertTokenizer } from './BertTokenizer';
import { preprocessImage, normalizeEmbedding } from './ImagePreprocessor';

let InferenceSession: any = null;
let Tensor: any = null;

if (Platform.OS !== 'web') {
  try {
    const onnx = require('onnxruntime-react-native');
    InferenceSession = onnx.InferenceSession;
    Tensor = onnx.Tensor;
  } catch (e) {
    console.warn('Failed to load onnxruntime-react-native:', e);
  }
}

export type ModelType = 'chinese-clip' | 'siglip2' | 'mobileclip' | 'mock';

interface ModelInfo {
  type: ModelType;
  modelPath: string;
  vocabPath?: string;
  isCombined: boolean;
  maxTextLength: number;
  embeddingDim: number;
  imageSize: number;
}

export class AIService {
  private static _instance: AIService | null = null;
  private _initialized: boolean = false;
  private _session: any = null;
  private _modelType: ModelType = 'mock';
  private _modelInfo: ModelInfo | null = null;
  private _lastError: string | null = null;

  static getInstance(): AIService {
    if (!AIService._instance) {
      AIService._instance = new AIService();
    }
    return AIService._instance;
  }

  async initialize(): Promise<void> {
    this._lastError = null;

    try {
      if (Platform.OS === 'web') {
        throw new Error('ONNX not supported on web platform');
      }

      if (!InferenceSession || !Tensor) {
        console.warn('ONNX Runtime not available, using mock mode');
        this._modelType = 'mock';
        this._initialized = true;
        return;
      }

      await this.detectAndLoadModel();
      this._initialized = true;
      console.log(`AI Service initialized (${this._modelType})`);
    } catch (error) {
      this._lastError = error instanceof Error ? error.message : String(error);
      console.error('AI Service initialization failed:', this._lastError);
      console.warn('Falling back to mock mode');
      this._modelType = 'mock';
      this._initialized = true;
    }
  }

  private async detectAndLoadModel(): Promise<void> {
    const modelPaths = await this.scanModelFiles();

    for (const modelInfo of modelPaths) {
      try {
        await this.loadModel(modelInfo);
        this._modelInfo = modelInfo;
        this._modelType = modelInfo.type;
        console.log(`Model loaded: ${modelInfo.type} from ${modelInfo.modelPath}`);
        return;
      } catch (error) {
        console.warn(`Failed to load ${modelInfo.type}:`, error);
      }
    }

    throw new Error('No compatible model found');
  }

  private async scanModelFiles(): Promise<ModelInfo[]> {
    const models: ModelInfo[] = [];
    const searchPaths = [
      `${Paths.document.uri}models/`,
      `${Paths.bundle.uri}models/`,
      'file:///android_asset/models/',
    ];

    console.log('Scanning for model files...');
    console.log('Search paths:', searchPaths);

    for (const basePath of searchPaths) {
      try {
        console.log(`Checking path: ${basePath}`);
        const dir = new Directory(basePath);
        if (!dir.exists) {
          console.log(`Directory does not exist: ${basePath}`);
          continue;
        }

        console.log(`Directory exists: ${basePath}`);
        const files = dir.list();
        console.log(`Found ${files.length} items in ${basePath}`);

        for (const file of files) {
          console.log(`Found item: ${file.name} (${file instanceof File ? 'file' : 'dir'})`);
          if (file instanceof File && file.name.endsWith('.onnx')) {
            const modelInfo = this.identifyModel(file.name, file.uri);
            if (modelInfo) {
              console.log(`Identified model: ${modelInfo.type} at ${file.uri}`);
              models.push(modelInfo);
            }
          }
        }
      } catch (error) {
        console.log(`Failed to scan ${basePath}:`, error);
      }
    }

    console.log(`Total models found: ${models.length}`);

    models.sort((a, b) => {
      const priority: Record<string, number> = { 'chinese-clip': 1, siglip2: 2, mobileclip: 3 };
      return (priority[a.type] || 99) - (priority[b.type] || 99);
    });

    return models;
  }

  private identifyModel(filename: string, fullPath: string): ModelInfo | null {
    const lowerName = filename.toLowerCase();
    console.log(`Identifying model: ${filename}`);

    if (
      lowerName.includes('chinese') ||
      lowerName.includes('chinese_clip') ||
      lowerName === 'chinese-clip.onnx'
    ) {
      return {
        type: 'chinese-clip',
        modelPath: fullPath,
        isCombined: true,
        maxTextLength: 52,
        embeddingDim: 512,
        imageSize: 224,
      };
    }

    if (lowerName.includes('siglip') || lowerName.includes('siglip2')) {
      return {
        type: 'siglip2',
        modelPath: fullPath,
        isCombined: true,
        maxTextLength: 64,
        embeddingDim: 768,
        imageSize: 224,
      };
    }

    return null;
  }

  private async loadModel(modelInfo: ModelInfo): Promise<void> {
    this._session = await InferenceSession.create(modelInfo.modelPath, {
      executionProviders: ['cpu'],
      graphOptimizationLevel: 'all',
    });

    if (modelInfo.type === 'chinese-clip') {
      await getBertTokenizer();
    }
  }

  async encodeImage(imageUri: string): Promise<number[]> {
    if (!this._initialized) {
      throw new Error('AI_NOT_INITIALIZED');
    }

    if (this._modelType === 'mock') {
      return this._mockEncodeImage(imageUri);
    }

    const preprocessed = await preprocessImage(imageUri);

    if (this._modelInfo?.isCombined) {
      return this._encodeImageCombined(preprocessed.data);
    }

    throw new Error(`Image encoding not implemented for ${this._modelType}`);
  }

  private async _encodeImageCombined(imageData: Float32Array): Promise<number[]> {
    const inputTensor = new Tensor('float32', imageData, [1, 3, 224, 224]);
    const feeds = { pixel_values: inputTensor };

    const outputs = await this._session.run(feeds);
    const embedding = outputs.image_embeds || outputs.image_features;

    if (!embedding) {
      throw new Error('Model did not return image embedding');
    }

    const embeddingArray = Array.from(embedding.data as Float32Array);
    return normalizeEmbedding(embeddingArray);
  }

  async encodeText(text: string): Promise<number[]> {
    if (!this._initialized) {
      throw new Error('AI_NOT_INITIALIZED');
    }

    if (this._modelType === 'mock') {
      return this._mockEncodeText(text);
    }

    if (this._modelType === 'chinese-clip') {
      return this._encodeTextChineseClip(text);
    }

    if (this._modelType === 'siglip2') {
      throw new Error('SigLIP 2 text encoding not yet implemented');
    }

    throw new Error(`Text encoding not implemented for ${this._modelType}`);
  }

  private async _encodeTextChineseClip(text: string): Promise<number[]> {
    const tokenizer = await getBertTokenizer();
    const tokenIds = tokenizer.encode(text);
    const attentionMask = tokenizer.createAttentionMask(tokenIds);

    const inputTensor = new Tensor('int64', tokenIds, [1, 52]);
    const maskTensor = new Tensor('int64', attentionMask, [1, 52]);

    const feeds = {
      input_ids: inputTensor,
      attention_mask: maskTensor,
    };

    const outputs = await this._session.run(feeds);
    const embedding = outputs.text_embeds || outputs.text_features;

    if (!embedding) {
      throw new Error('Model did not return text embedding');
    }

    const embeddingArray = Array.from(embedding.data as Float32Array);
    return normalizeEmbedding(embeddingArray);
  }

  private _mockEncodeImage(imageUri: string): number[] {
    const seed = this._hashString(imageUri);
    return this._generateMockEmbedding(seed, 512);
  }

  private _mockEncodeText(text: string): number[] {
    const seed = this._hashString(text);
    return this._generateMockEmbedding(seed, 512);
  }

  private _hashString(input: string): number {
    let hash = 5381;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) + hash + input.charCodeAt(i)) & 0x7fffffff;
    }
    return hash;
  }

  private _generateMockEmbedding(seed: number, dim: number): number[] {
    let s = seed || 1;
    const next = () => {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      return (s >>> 0) / 0xffffffff;
    };

    const embedding = new Array(dim).fill(0).map(() => (next() - 0.5) * 2);
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

  isInitialized(): boolean {
    return this._initialized;
  }

  getModelType(): ModelType {
    return this._modelType;
  }

  getModelInfo(): ModelInfo | null {
    return this._modelInfo;
  }

  async release(): Promise<void> {
    if (this._session) {
      await this._session.release();
      this._session = null;
    }
    this._initialized = false;
    this._modelType = 'mock';
    this._modelInfo = null;
  }

  getDebugInfo(): Record<string, any> {
    return {
      initialized: this._initialized,
      modelType: this._modelType,
      modelInfo: this._modelInfo,
      lastError: this._lastError,
      platform: Platform.OS,
      onnxAvailable: !!InferenceSession && !!Tensor,
      sessionCreated: !!this._session,
    };
  }
}
