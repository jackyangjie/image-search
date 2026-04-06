/**
 * AIService interface definition
 * Both real and mock implementations must implement this interface
 */

export interface IAIService {
  initialize(): Promise<void>;
  isInitialized(): boolean;
  encodeImage(imageUri: string): Promise<number[]>;
  encodeText(text: string): Promise<number[]>;
  cosineSimilarity(a: number[], b: number[]): number;
  warmUp(): Promise<void>;
  release(): Promise<void>;
}

export interface AIServiceConstructor {
  getInstance(): IAIService;
}
