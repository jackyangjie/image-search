import { AIService } from '../AIService';

describe('AIService', () => {
  let service: AIService;

  beforeEach(() => {
    service = AIService.getInstance();
  });

  afterEach(() => {
    (AIService as any)._instance = null;
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = AIService.getInstance();
      const instance2 = AIService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    it('should initialize without errors', async () => {
      await expect(service.initialize()).resolves.not.toThrow();
    });

    it('should mark as initialized after initialization', async () => {
      await service.initialize();
      expect(service.isInitialized()).toBe(true);
    });
  });

  describe('encodeImage', () => {
    it('should return vector for valid image URI', async () => {
      await service.initialize();
      const imageUri = 'file:///path/to/image.jpg';
      const embedding = await service.encodeImage(imageUri);

      expect(embedding).toBeInstanceOf(Array);
      expect(embedding.length).toBe(512);
      embedding.forEach((val: number) => {
        expect(typeof val).toBe('number');
        expect(val).toBeGreaterThanOrEqual(-1);
        expect(val).toBeLessThanOrEqual(1);
      });
    });

    it('should return consistent results for same image', async () => {
      await service.initialize();
      const imageUri = 'file:///path/to/image.jpg';
      const embedding1 = await service.encodeImage(imageUri);
      const embedding2 = await service.encodeImage(imageUri);

      expect(embedding1).toEqual(embedding2);
    });

    it('should throw error if not initialized', async () => {
      const imageUri = 'file:///path/to/image.jpg';
      await expect(service.encodeImage(imageUri)).rejects.toThrow('AI_NOT_INITIALIZED');
    });

    it('should return different embeddings for different images', async () => {
      await service.initialize();
      const embedding1 = await service.encodeImage('file:///image1.jpg');
      const embedding2 = await service.encodeImage('file:///image2.jpg');

      expect(embedding1).not.toEqual(embedding2);
    });
  });

  describe('encodeText', () => {
    it('should return vector for text query', async () => {
      await service.initialize();
      const query = 'a beautiful sunset at the beach';
      const embedding = await service.encodeText(query);

      expect(embedding).toBeInstanceOf(Array);
      expect(embedding.length).toBe(512);
      embedding.forEach((val: number) => {
        expect(typeof val).toBe('number');
      });
    });

    it('should return consistent results for same text', async () => {
      await service.initialize();
      const query = 'a cat sleeping';
      const embedding1 = await service.encodeText(query);
      const embedding2 = await service.encodeText(query);

      expect(embedding1).toEqual(embedding2);
    });

    it('should throw error if not initialized', async () => {
      await expect(service.encodeText('test query')).rejects.toThrow('AI_NOT_INITIALIZED');
    });

    it('should handle empty string', async () => {
      await service.initialize();
      const embedding = await service.encodeText('');

      expect(embedding).toBeInstanceOf(Array);
      expect(embedding.length).toBe(512);
    });

    it('should return different embeddings for different texts', async () => {
      await service.initialize();
      const embedding1 = await service.encodeText('cat');
      const embedding2 = await service.encodeText('dog');

      expect(embedding1).not.toEqual(embedding2);
    });
  });

  describe('cosineSimilarity', () => {
    it('should return 1 for identical vectors', () => {
      const vector = [1, 0, 0, 0];
      const similarity = service.cosineSimilarity(vector, vector);
      expect(similarity).toBeCloseTo(1, 5);
    });

    it('should return -1 for opposite vectors', () => {
      const vector1 = [1, 0, 0];
      const vector2 = [-1, 0, 0];
      const similarity = service.cosineSimilarity(vector1, vector2);
      expect(similarity).toBeCloseTo(-1, 5);
    });

    it('should return 0 for orthogonal vectors', () => {
      const vector1 = [1, 0];
      const vector2 = [0, 1];
      const similarity = service.cosineSimilarity(vector1, vector2);
      expect(similarity).toBeCloseTo(0, 5);
    });

    it('should return value between -1 and 1', () => {
      const vector1 = [1, 2, 3];
      const vector2 = [4, 5, 6];
      const similarity = service.cosineSimilarity(vector1, vector2);
      expect(similarity).toBeGreaterThanOrEqual(-1);
      expect(similarity).toBeLessThanOrEqual(1);
    });

    it('should throw error for vectors of different lengths', () => {
      const vector1 = [1, 2, 3];
      const vector2 = [1, 2];
      expect(() => service.cosineSimilarity(vector1, vector2)).toThrow();
    });

    it('should throw error for zero vectors', () => {
      const vector1 = [0, 0, 0];
      const vector2 = [1, 2, 3];
      expect(() => service.cosineSimilarity(vector1, vector2)).toThrow();
    });
  });

  describe('release', () => {
    it('should release resources', async () => {
      await service.initialize();
      await service.release();
      expect(service.isInitialized()).toBe(false);
    });
  });

  describe('image-text similarity', () => {
    it('should produce valid similarity score for image and text embeddings', async () => {
      await service.initialize();
      const imageUri = 'file:///sunset.jpg';
      const textQuery = 'sunset';

      const imageEmbedding = await service.encodeImage(imageUri);
      const textEmbedding = await service.encodeText(textQuery);

      const similarity = service.cosineSimilarity(imageEmbedding, textEmbedding);

      // In mock mode, embeddings are random, so similarity should be in valid range [-1, 1]
      // In real mode with CLIP, related image-text pairs would have positive similarity
      expect(similarity).toBeGreaterThanOrEqual(-1);
      expect(similarity).toBeLessThanOrEqual(1);
    });
  });
});
