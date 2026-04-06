import { SearchService } from '../SearchService';
import { DBService } from '@/services/db';
import { AIService } from '@/services/ai';
import { EventBus } from '@/services/event';

describe('SearchService', () => {
  let service: SearchService;
  let mockDbService: jest.Mocked<DBService>;
  let mockAiService: jest.Mocked<AIService>;

  const mockEmbedding = new Array(512).fill(0.1);
  const mockSearchResults = [
    {
      photo: {
        id: 1,
        uuid: 'uuid-1',
        filePath: '/path/1.jpg',
        thumbnailPath: '/path/thumb1.jpg',
        createdAt: new Date(),
        modifiedAt: new Date(),
        isIndexed: true,
        embedding: mockEmbedding,
      },
      similarity: 0.95,
    },
    {
      photo: {
        id: 2,
        uuid: 'uuid-2',
        filePath: '/path/2.jpg',
        thumbnailPath: '/path/thumb2.jpg',
        createdAt: new Date(),
        modifiedAt: new Date(),
        isIndexed: true,
        embedding: mockEmbedding,
      },
      similarity: 0.85,
    },
  ];

  beforeEach(() => {
    service = SearchService.getInstance();
    mockDbService = DBService.getInstance() as jest.Mocked<DBService>;
    mockAiService = AIService.getInstance() as jest.Mocked<AIService>;

    mockAiService.encodeText.mockResolvedValue(mockEmbedding);
    mockDbService.searchByVector.mockResolvedValue(mockSearchResults);
  });

  afterEach(() => {
    (SearchService as unknown as { _instance: null })._instance = null;
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = SearchService.getInstance();
      const instance2 = SearchService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('search', () => {
    it('should perform search and return results', async () => {
      const query = 'sunset at beach';
      const results = await service.search(query);

      expect(results).toHaveLength(2);
      expect(mockAiService.encodeText).toHaveBeenCalledWith(query);
      expect(mockDbService.searchByVector).toHaveBeenCalledWith(mockEmbedding, 20, 0.5);
    });

    it('should apply custom options', async () => {
      const query = 'cat';
      const options = { limit: 10, threshold: 0.8 };

      await service.search(query, options);

      expect(mockDbService.searchByVector).toHaveBeenCalledWith(mockEmbedding, 10, 0.8);
    });

    it('should sort results by similarity descending', async () => {
      const query = 'test';
      const results = await service.search(query);

      expect(results[0].similarity).toBeGreaterThanOrEqual(results[1].similarity);
    });

    it('should add query to history', async () => {
      const query = 'birthday party';
      await service.search(query);

      const history = await service.getSearchHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].query).toBe(query);
    });

    it('should handle empty results', async () => {
      mockDbService.searchByVector.mockResolvedValue([]);

      const query = 'nonexistent query';
      const results = await service.search(query);

      expect(results).toHaveLength(0);
    });

    it('should throw error if AI encoding fails', async () => {
      mockAiService.encodeText.mockRejectedValue(new Error('AI Error'));

      await expect(service.search('test')).rejects.toThrow();
    });

    it('should throw error if database search fails', async () => {
      mockDbService.searchByVector.mockRejectedValue(new Error('DB Error'));

      await expect(service.search('test')).rejects.toThrow();
    });
  });

  describe('getSearchHistory', () => {
    it('should return empty array initially', async () => {
      const history = await service.getSearchHistory();
      expect(history).toEqual([]);
    });

    it('should return search history with timestamps', async () => {
      await service.search('query1');
      await service.search('query2');

      const history = await service.getSearchHistory();

      expect(history).toHaveLength(2);
      history.forEach(item => {
        expect(item.query).toBeDefined();
        expect(item.timestamp).toBeInstanceOf(Date);
        expect(item.resultCount).toBeDefined();
      });
    });

    it('should limit history to 50 items', async () => {
      for (let i = 0; i < 55; i++) {
        await service.search(`query-${i}`);
      }

      const history = await service.getSearchHistory();
      expect(history.length).toBeLessThanOrEqual(50);
    });

    it('should deduplicate queries', async () => {
      await service.search('same query');
      await service.search('same query');
      await service.search('same query');

      const history = await service.getSearchHistory();
      const sameQueries = history.filter(h => h.query === 'same query');
      expect(sameQueries.length).toBe(1);
    });
  });

  describe('addToHistory', () => {
    it('should add item to beginning of history', async () => {
      await service.addToHistory('first', 10);
      await service.addToHistory('second', 20);

      const history = await service.getSearchHistory();
      expect(history[0].query).toBe('second');
      expect(history[1].query).toBe('first');
    });

    it('should update existing query timestamp', async () => {
      await service.addToHistory('query', 10);
      const firstTimestamp = (await service.getSearchHistory())[0].timestamp;

      await new Promise(resolve => setTimeout(resolve, 10));
      await service.addToHistory('query', 15);
      const secondTimestamp = (await service.getSearchHistory())[0].timestamp;

      expect(secondTimestamp.getTime()).toBeGreaterThan(firstTimestamp.getTime());
    });
  });

  describe('clearHistory', () => {
    it('should clear all history', async () => {
      await service.search('query1');
      await service.search('query2');

      await service.clearHistory();
      const history = await service.getSearchHistory();

      expect(history).toHaveLength(0);
    });
  });

  describe('getHotSearches', () => {
    it('should return predefined hot searches', () => {
      const hotSearches = service.getHotSearches();

      expect(hotSearches).toBeInstanceOf(Array);
      expect(hotSearches.length).toBeGreaterThan(0);
      hotSearches.forEach(search => {
        expect(typeof search).toBe('string');
        expect(search.length).toBeGreaterThan(0);
      });
    });
  });

  describe('event handling', () => {
    it('should emit search:start event', async () => {
      const startCallback = jest.fn();
      EventBus.on('search:start', startCallback);

      await service.search('test query');

      expect(startCallback).toHaveBeenCalled();
    });

    it('should emit search:complete event', async () => {
      const completeCallback = jest.fn();
      EventBus.on('search:complete', completeCallback);

      await service.search('test');

      expect(completeCallback).toHaveBeenCalledWith({
        query: 'test',
        results: mockSearchResults,
        duration: expect.any(Number),
      });
    });
  });
});
