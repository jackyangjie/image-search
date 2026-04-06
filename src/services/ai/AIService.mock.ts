/**
 * Mock AIService for Expo Go development
 * Returns random embeddings for testing UI without real AI models
 */

export class AIServiceMock {
  private static _instance: AIServiceMock | null = null;
  private _initialized: boolean = false;

  static getInstance(): AIServiceMock {
    if (!AIServiceMock._instance) {
      AIServiceMock._instance = new AIServiceMock();
    }
    return AIServiceMock._instance;
  }

  async initialize(): Promise<void> {
    console.log('AI Service initialized (MOCK MODE)');
    this._initialized = true;
  }

  isInitialized(): boolean {
    return this._initialized;
  }

  async encodeImage(imageUri: string): Promise<number[]> {
    if (!this._initialized) {
      throw new Error('AI_NOT_INITIALIZED');
    }

    const hash = this.hashString(imageUri);
    const embedding: number[] = [];
    for (let i = 0; i < 512; i++) {
      embedding.push(Math.sin(hash + i * 0.1) * 0.5);
    }
    return this.normalizeEmbedding(embedding);
  }

  async encodeText(text: string): Promise<number[]> {
    if (!this._initialized) {
      throw new Error('AI_NOT_INITIALIZED');
    }

    const hash = this.hashString(text.toLowerCase());
    const embedding: number[] = [];
    for (let i = 0; i < 512; i++) {
      embedding.push(Math.sin(hash + i * 0.1 + text.length * 0.01) * 0.5);
    }
    return this.normalizeEmbedding(embedding);
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
    // Mock warmup does nothing
  }

  async release(): Promise<void> {
    this._initialized = false;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash;
  }

  private normalizeEmbedding(embedding: number[]): number[] {
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0) return embedding;
    return embedding.map(val => val / magnitude);
  }
}
