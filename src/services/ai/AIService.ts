import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { documentDirectory, bundleDirectory } from 'expo-file-system';
import { getBertTokenizer } from './BertTokenizer';
import { getSiglipTokenizer } from './SiglipTokenizer';
import { preprocessImage, normalizeEmbedding } from './ImagePreprocessor';

let InferenceSession: any = null;
let Tensor: any = null;
let onnxModule: any = null;

async function loadOnnxModule() {
  if (Platform.OS === 'web') {
    return null;
  }

  if (onnxModule) {
    return onnxModule;
  }

  try {
    const onnx = require('onnxruntime-react-native');
    onnxModule = onnx;
    InferenceSession = onnx.InferenceSession;
    Tensor = onnx.Tensor;
    console.log('ONNX Runtime loaded successfully');
    return onnx;
  } catch (e) {
    console.warn('Failed to load onnxruntime-react-native:', e);
    return null;
  }
}

export type ModelType = 'chinese-clip' | 'siglip2';

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
  private _modelType: ModelType | null = null;
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

      await loadOnnxModule();

      if (!InferenceSession || !Tensor) {
        throw new Error('ONNX Runtime not available. Please run on a real device with native code support.');
      }

      await this.detectAndLoadModel();
      this._initialized = true;
      console.log(`AI Service initialized (${this._modelType})`);
    } catch (error) {
      this._lastError = error instanceof Error ? error.message : String(error);
      console.error('AI Service initialization failed:', this._lastError);
      throw new Error(`AI Service initialization failed: ${this._lastError}`);
    }
  }

  private async detectAndLoadModel(): Promise<void> {
    // 首先确保模型文件已复制到可访问位置
    await this.ensureModelFilesAvailable();
    
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

  /**
   * 将模型从APK assets复制到DocumentDirectory
   * ONNX Runtime不支持直接加载asset:/路径，必须先复制
   */
  private async ensureModelFilesAvailable(): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }
    
    try {
      // 复制SigLIP2 INT8量化模型（361MB，推理更快）和分词器
      await this.copyModelFromAssets(
        'asset:/models/siglip2-base/onnx/model_int8.onnx',
        'siglip2-base/onnx/model_int8.onnx'
      );
      await this.copyModelFromAssets(
        'asset:/models/siglip2-base/tokenizer.json',
        'siglip2-base/tokenizer.json'
      );
      
      // 备选：复制Chinese-CLIP模型
      await this.copyModelFromAssets(
        'asset:/models/chinese-clip-base/onnx/model.onnx',
        'chinese-clip-base/onnx/model.onnx'
      );
      await this.copyModelFromAssets(
        'asset:/models/chinese-clip-base/vocab.txt',
        'chinese-clip-base/vocab.txt'
      );
    } catch (error) {
      console.error('Failed to copy model files:', error);
    }
  }

  /**
   * 复制单个模型文件从assets到DocumentDirectory
   */
  private async copyModelFromAssets(
    sourceAssetPath: string,
    destRelativePath: string
  ): Promise<string> {
    const destDir = `${documentDirectory}models/`;
    const destPath = `${destDir}${destRelativePath}`;
    
    // 检查目标文件是否已存在
    const destInfo = await FileSystem.getInfoAsync(destPath);
    if (destInfo.exists) {
      console.log(`Model already exists: ${destPath}`);
      return destPath;
    }
    
    // 确保目标目录存在
    const dirInfo = await FileSystem.getInfoAsync(destDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
    }
    
    // 确保子目录存在
    const subDir = destPath.substring(0, destPath.lastIndexOf('/'));
    const subDirInfo = await FileSystem.getInfoAsync(subDir);
    if (!subDirInfo.exists) {
      await FileSystem.makeDirectoryAsync(subDir, { intermediates: true });
    }
    
    // Expo FileSystem 支持 asset:/ 方式访问 APK 内打包的资源
    // file:///android_asset/ 并非标准 React Native 路径，getInfoAsync 无法识别
    // 直接尝试复制，跳过存在性检查（Asset 文件无法通过 getInfoAsync 判断）
    console.log(`Copying model from ${sourceAssetPath} to ${destPath}...`);
    
    try {
      await FileSystem.copyAsync({
        from: sourceAssetPath,
        to: destPath,
      });
      console.log(`Model copied successfully: ${destPath}`);
      return destPath;
    } catch (error) {
      throw new Error(`Failed to copy model from ${sourceAssetPath}: ${error}`);
    }
  }

  private async scanModelFiles(): Promise<ModelInfo[]> {
    const models: ModelInfo[] = [];
    
    // 检查APK assets目录中的模型（使用 asset:/ 协议，Expo FileSystem 支持）
    const assetModelPaths = [
      {
        path: `asset:/models/chinese-clip-base/onnx/model.onnx`,
        type: 'chinese-clip' as ModelType,
      },
      {
        path: `asset:/models/siglip2-base/onnx/model_int8.onnx`,
        type: 'siglip2' as ModelType,
      },
    ];
    
    // 备选路径: DocumentDirectory (如果已从assets复制)
    const docModelPaths = [
      {
        path: `${documentDirectory}models/chinese-clip-base/onnx/model.onnx`,
        type: 'chinese-clip' as ModelType,
      },
      {
        path: `${documentDirectory}models/siglip2-base/onnx/model_int8.onnx`,
        type: 'siglip2' as ModelType,
      },
    ];

    console.log('Scanning for model files...');
    
    // 先检查DocumentDirectory（ONNX Runtime 需要真实文件路径，asset:/ 不可用）
    for (const modelDef of docModelPaths) {
      try {
        console.log(`Trying document model path: ${modelDef.path}`);
        const fileInfo = await FileSystem.getInfoAsync(modelDef.path);
        
        if (fileInfo.exists) {
          console.log(`Document model found: ${modelDef.type} at ${modelDef.path}`);
          const modelInfo = this.createModelInfo(modelDef.type, modelDef.path);
          if (modelInfo) {
            models.push(modelInfo);
            console.log(`Model added: ${modelDef.type}`);
          }
        } else {
          console.log(`Document model not found: ${modelDef.path}`);
        }
      } catch (error) {
        console.log(`Failed to check document ${modelDef.path}:`, error);
      }
    }
    
    // 再检查assets目录（仅作为后备，ONNX Runtime 不支持 asset:/ 路径）
    for (const modelDef of assetModelPaths) {
      try {
        console.log(`Trying asset model path: ${modelDef.path}`);
        const fileInfo = await FileSystem.getInfoAsync(modelDef.path);
        
        if (fileInfo.exists) {
          console.log(`Asset model found: ${modelDef.type} at ${modelDef.path}`);
          // asset:/ 路径不可直接用于 ONNX Runtime，仅当文档目录没有时才使用
          if (!models.some(m => m.type === modelDef.type)) {
            const modelInfo = this.createModelInfo(modelDef.type, modelDef.path);
            if (modelInfo) {
              models.push(modelInfo);
              console.log(`Model added: ${modelDef.type}`);
            }
          }
        } else {
          console.log(`Asset model not found: ${modelDef.path}`);
        }
      } catch (error) {
        console.log(`Failed to check asset ${modelDef.path}:`, error);
      }
    }

    console.log(`Total models found: ${models.length}`);
    
    // 优先级排序：Chinese-CLIP 优先（中文搜索更准确）
    models.sort((a, b) => {
      const priority: Record<string, number> = { 'chinese-clip': 1, siglip2: 2 };
      return (priority[a.type] || 99) - (priority[b.type] || 99);
    });

    return models;
  }

  private async scanDocumentDirectory(models: ModelInfo[]): Promise<void> {
    const searchPaths = [
      `${documentDirectory}models/`,
      `${bundleDirectory}models/`,
    ];

    const { readDirectoryAsync, getInfoAsync } = require('expo-file-system');

    for (const basePath of searchPaths) {
      try {
        console.log(`Scanning path: ${basePath}`);
        const dirInfo = await getInfoAsync(basePath);
        
        if (!dirInfo.exists || !dirInfo.isDirectory) {
          console.log(`Directory does not exist: ${basePath}`);
          continue;
        }
        
        const files = await readDirectoryAsync(basePath);
        console.log(`Found ${files.length} items in ${basePath}`);

        for (const filename of files) {
          const fullPath = `${basePath}${filename}`;
          const fileInfo = await getInfoAsync(fullPath);
          
          if (fileInfo.isDirectory) {
            // 递归扫描子目录中的 .onnx 文件
            try {
              const subFiles = await readDirectoryAsync(fullPath);
              for (const subFile of subFiles) {
                if (subFile.endsWith('.onnx')) {
                  const subPath = `${fullPath}/${subFile}`;
                  console.log(`Found model file: ${subFile} at ${subPath}`);
                  const modelInfo = this.identifyModelFromPath(subFile, subPath);
                  if (modelInfo) {
                    models.push(modelInfo);
                  }
                }
              }
            } catch (e) {
              console.log(`Failed to scan subdirectory ${fullPath}:`, e);
            }
          } else if (filename.endsWith('.onnx')) {
            console.log(`Found model file: ${filename}`);
            const modelInfo = this.identifyModelFromPath(filename, fullPath);
            if (modelInfo) {
              models.push(modelInfo);
            }
          }
        }
      } catch (error) {
        console.log(`Failed to scan ${basePath}:`, error);
      }
    }
  }

  private createModelInfo(type: ModelType, modelPath: string): ModelInfo | null {
    if (type === 'chinese-clip') {
      const vocabPath = modelPath.replace('/onnx/model.onnx', '/vocab.txt');
      return {
        type: 'chinese-clip',
        modelPath: modelPath,
        vocabPath: vocabPath,
        isCombined: true,
        maxTextLength: 52,
        embeddingDim: 512,
        imageSize: 224,
      };
    }
    
    if (type === 'siglip2') {
      const vocabPath = modelPath.replace('/onnx/model_int8.onnx', '/tokenizer.json');
      return {
        type: 'siglip2',
        modelPath: modelPath,
        vocabPath: 'asset:/models/siglip2-base/tokenizer.json',
        isCombined: true,
        maxTextLength: 64,
        embeddingDim: 768,
        imageSize: 256,
      };
    }
    
    return null;
  }

  private identifyModelFromPath(filename: string, fullPath: string): ModelInfo | null {
    const lowerName = filename.toLowerCase();
    
    if (
      lowerName.includes('chinese') ||
      lowerName.includes('chinese_clip') ||
      lowerName === 'model.onnx' && fullPath.includes('chinese-clip')
    ) {
      return this.createModelInfo('chinese-clip', fullPath);
    }

    if (lowerName.includes('siglip') || fullPath.includes('siglip')) {
      return this.createModelInfo('siglip2', fullPath);
    }

    return null;
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
    console.log(`[Model Loading] Starting to load model: ${modelInfo.type}`);
    console.log(`[Model Loading] Model path: ${modelInfo.modelPath}`);
    console.log(`[Model Loading] Model info:`, JSON.stringify(modelInfo, null, 2));
    
    this._session = await InferenceSession.create(modelInfo.modelPath, {
      executionProviders: ['cpu'],
      graphOptimizationLevel: 'all',
    });

    if (modelInfo.type === 'chinese-clip') {
      console.log(`[Model Loading] Loading BERT tokenizer for Chinese-CLIP...`);
      await getBertTokenizer();
      console.log(`[Model Loading] BERT tokenizer loaded successfully`);
    }
    
    console.log(`[Model Loading] Model ${modelInfo.type} loaded successfully!`);
  }

  async encodeImage(imageUri: string): Promise<number[]> {
    if (!this._initialized) {
      throw new Error('AI_NOT_INITIALIZED');
    }

    if (!this._modelType) {
      throw new Error('AI_MODEL_NOT_LOADED');
    }

    const imageSize = this._modelInfo?.imageSize || 224;
    const preprocessed = await preprocessImage(imageUri, imageSize);

    if (this._modelInfo?.isCombined) {
      return this._encodeImageCombined(preprocessed.data, imageSize);
    }

    throw new Error(`Image encoding not implemented for ${this._modelType}`);
  }

  private async _encodeImageCombined(imageData: Float32Array, imageSize: number = 224): Promise<number[]> {
    const inputTensor = new Tensor('float32', imageData, [1, 3, imageSize, imageSize]);
    // Combined 模型同时有 image 和 text 输入，即使编码图片也需要提供 dummy text input
    const maxLen = this._modelInfo?.maxTextLength || 52;
    const dummyInputIds = new Tensor('int64', new Array(maxLen).fill(0), [1, maxLen]);
    
    const feeds: Record<string, any> = {
      pixel_values: inputTensor,
      input_ids: dummyInputIds,
    };
    // Chinese-CLIP 需要 attention_mask，SigLIP2 不需要
    if (this._modelType === 'chinese-clip') {
      feeds.attention_mask = new Tensor('int64', new Array(maxLen).fill(0), [1, maxLen]);
    }

    const outputs = await this._session.run(feeds);
    console.log('[SigLIP2 Image] Output keys:', Object.keys(outputs).join(', '));
    const outputKeys = Object.keys(outputs);
    for (const key of outputKeys) {
      console.log(`[SigLIP2 Image] ${key} shape:`, outputs[key].dims, 'first5:', Array.from(outputs[key].data).slice(0,5));
    }
    const embedding = outputs.image_embeds || outputs.image_features || outputs[outputKeys[0]];

    if (!embedding) {
      throw new Error('Model did not return image embedding');
    }

    const embeddingArray = Array.from(embedding.data as Float32Array);
    console.log(`[SigLIP2 Image] Using output: ${outputKeys.find(k => outputs[k] === embedding)}, dim: ${embeddingArray.length}`);
    return normalizeEmbedding(embeddingArray);
  }

  async encodeText(text: string): Promise<number[]> {
    if (!this._initialized) {
      throw new Error('AI_NOT_INITIALIZED');
    }

    if (!this._modelType) {
      throw new Error('AI_MODEL_NOT_LOADED');
    }

    if (this._modelType === 'chinese-clip') {
      return this._encodeTextChineseClip(text);
    }

    if (this._modelType === 'siglip2') {
      return this._encodeTextSiglip2(text);
    }

    throw new Error(`Text encoding not implemented for ${this._modelType}`);
  }

  private async _encodeTextChineseClip(text: string): Promise<number[]> {
    const tokenizer = await getBertTokenizer();
    const tokenIds = tokenizer.encode(text);
    const attentionMask = tokenizer.createAttentionMask(tokenIds);

    const inputTensor = new Tensor('int64', tokenIds, [1, 52]);
    const maskTensor = new Tensor('int64', attentionMask, [1, 52]);

    // Combined model 同时需要 image 和 text 输入，即使只编码文本也需要提供 dummy pixel_values
    const imageSize = 224;
    const dummyPixelValues = new Tensor('float32', new Float32Array(3 * imageSize * imageSize), [1, 3, imageSize, imageSize]);

    const feeds = {
      pixel_values: dummyPixelValues,
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

  private async _encodeTextSiglip2(text: string): Promise<number[]> {
    const tokenizer = await getSiglipTokenizer();
    const tokenIds = tokenizer.encode(text);

    const inputTensor = new Tensor('int64', tokenIds, [1, 64]);

    // 合并模型需要同时提供 image 和 text 输入
    const imageSize = this._modelInfo?.imageSize || 256;
    const dummyPixelValues = new Tensor('float32', new Float32Array(3 * imageSize * imageSize), [1, 3, imageSize, imageSize]);

    // SigLIP2 合并模型没有 attention_mask input，只需要 pixel_values + input_ids
    const feeds: Record<string, any> = {
      pixel_values: dummyPixelValues,
      input_ids: inputTensor,
    };

    const outputs = await this._session.run(feeds);
    console.log('[SigLIP2 Text] Output keys:', Object.keys(outputs).join(', '));
    const outputKeys = Object.keys(outputs);
    for (const key of outputKeys) {
      console.log(`[SigLIP2 Text] ${key} shape:`, outputs[key].dims, 'len:', outputs[key].data?.length);
    }
    const embedding = outputs.text_embeds || outputs.text_features || outputs.pooler_output || outputs.image_embeds || outputs[outputKeys[0]];

    if (!embedding) {
      throw new Error('Model did not return text embedding');
    }

    const embeddingArray = Array.from(embedding.data as Float32Array);
    console.log(`[SigLIP2 Text] Using output: ${outputKeys.find(k => outputs[k] === embedding)}, dim: ${embeddingArray.length}`);
    return normalizeEmbedding(embeddingArray);
  }

  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) {
      throw new Error('Cannot compute cosine similarity for zero vectors');
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  isInitialized(): boolean {
    return this._initialized;
  }

  getModelType(): ModelType | null {
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
    this._modelType = null;
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
