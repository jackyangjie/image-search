import { DBService } from '../DBService';
import * as SQLite from 'expo-sqlite';

const mockExecAsync = jest.fn();
const mockGetAllAsync = jest.fn();
const mockGetFirstAsync = jest.fn();
const mockRunAsync = jest.fn();
const mockCloseAsync = jest.fn();

const mockDb = {
  execAsync: mockExecAsync,
  getAllAsync: mockGetAllAsync,
  getFirstAsync: mockGetFirstAsync,
  runAsync: mockRunAsync,
  closeAsync: mockCloseAsync,
};

const mockOpenDatabaseAsync = SQLite.openDatabaseAsync as jest.MockedFunction<
  typeof SQLite.openDatabaseAsync
>;

describe('DBService', () => {
  let service: DBService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOpenDatabaseAsync.mockResolvedValue(mockDb as any);
    service = DBService.getInstance();
  });

  afterEach(async () => {
    await service.close();
    (DBService as any)._instance = null;
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = DBService.getInstance();
      const instance2 = DBService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    it('should open database and execute schema', async () => {
      await service.initialize();

      expect(mockOpenDatabaseAsync).toHaveBeenCalledWith('smartphoto.db');
      expect(mockExecAsync).toHaveBeenCalled();
    });

    it('should throw error if initialization fails', async () => {
      mockOpenDatabaseAsync.mockRejectedValue(new Error('DB Error'));

      await expect(service.initialize()).rejects.toThrow('DB_INIT_FAILED');
    });
  });

  describe('insertPhoto', () => {
    const mockPhoto = {
      uuid: 'test-uuid-123',
      filePath: '/path/to/photo.jpg',
      thumbnailPath: '/path/to/thumb.jpg',
      createdAt: new Date('2024-01-01'),
      modifiedAt: new Date('2024-01-02'),
      width: 1920,
      height: 1080,
      embedding: [0.1, 0.2, 0.3],
      isIndexed: true,
      fileSize: 1024000,
    };

    beforeEach(async () => {
      await service.initialize();
    });

    it('should insert photo and return id', async () => {
      mockRunAsync.mockResolvedValue({ lastInsertRowId: 1, changes: 1 });

      const id = await service.insertPhoto(mockPhoto as any);

      expect(id).toBe(1);
      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO photos'),
        expect.arrayContaining([
          mockPhoto.uuid,
          mockPhoto.filePath,
          mockPhoto.thumbnailPath,
          mockPhoto.createdAt.toISOString(),
          mockPhoto.modifiedAt.toISOString(),
          mockPhoto.width,
          mockPhoto.height,
          JSON.stringify(mockPhoto.embedding),
          1,
          mockPhoto.fileSize,
        ])
      );
    });

    it('should throw error if database not initialized', async () => {
      await service.close();

      await expect(service.insertPhoto(mockPhoto as any)).rejects.toThrow(
        'DB_NOT_INITIALIZED'
      );
    });
  });

  describe('getPhoto', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should return photo by id', async () => {
      const mockRow = {
        id: 1,
        uuid: 'test-uuid',
        filePath: '/path/to/photo.jpg',
        thumbnailPath: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        modifiedAt: '2024-01-01T00:00:00.000Z',
        width: null,
        height: null,
        embedding: null,
        isIndexed: 0,
        fileSize: null,
      };
      mockGetFirstAsync.mockResolvedValue(mockRow);

      const photo = await service.getPhoto(1);

      expect(photo).toMatchObject({
        id: 1,
        uuid: 'test-uuid',
        filePath: '/path/to/photo.jpg',
      });
      expect(mockGetFirstAsync).toHaveBeenCalledWith(
        'SELECT * FROM photos WHERE id = ?',
        [1]
      );
    });

    it('should return null if photo not found', async () => {
      mockGetFirstAsync.mockResolvedValue(null);

      const photo = await service.getPhoto(999);

      expect(photo).toBeNull();
    });
  });

  describe('getPhotos', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should return photos with default options', async () => {
      const mockRows = [
        {
          id: 1,
          uuid: 'uuid-1',
          filePath: '/path/1.jpg',
          createdAt: '2024-01-01T00:00:00.000Z',
          modifiedAt: '2024-01-01T00:00:00.000Z',
          isIndexed: 1,
        },
        {
          id: 2,
          uuid: 'uuid-2',
          filePath: '/path/2.jpg',
          createdAt: '2024-01-02T00:00:00.000Z',
          modifiedAt: '2024-01-02T00:00:00.000Z',
          isIndexed: 0,
        },
      ];
      mockGetAllAsync.mockResolvedValue(mockRows);

      const photos = await service.getPhotos();

      expect(photos).toHaveLength(2);
      expect(photos[0].id).toBe(1);
      expect(photos[1].id).toBe(2);
    });

    it('should filter by isIndexed', async () => {
      mockGetAllAsync.mockResolvedValue([]);

      await service.getPhotos({ isIndexed: true });

      expect(mockGetAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('isIndexed = ?'),
        expect.arrayContaining([1, 50, 0])
      );
    });
  });

  describe('searchByVector', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should return search results sorted by similarity', async () => {
      const mockRows = [
        {
          id: 1,
          uuid: 'uuid-1',
          filePath: '/path/1.jpg',
          createdAt: '2024-01-01T00:00:00.000Z',
          modifiedAt: '2024-01-01T00:00:00.000Z',
          isIndexed: 1,
          embedding: JSON.stringify([0.1, 0.2, 0.3]),
        },
        {
          id: 2,
          uuid: 'uuid-2',
          filePath: '/path/2.jpg',
          createdAt: '2024-01-01T00:00:00.000Z',
          modifiedAt: '2024-01-01T00:00:00.000Z',
          isIndexed: 1,
          embedding: JSON.stringify([0.5, 0.6, 0.7]),
        },
      ];
      mockGetAllAsync.mockResolvedValue(mockRows);

      const queryVector = [0.1, 0.2, 0.3];
      const results = await service.searchByVector(queryVector, 10, 0.5);

      expect(results).toHaveLength(2);
      expect(results[0].similarity).toBeGreaterThanOrEqual(results[1].similarity);
    });

    it('should filter by threshold', async () => {
      const mockRows = [
        {
          id: 1,
          uuid: 'uuid-1',
          filePath: '/path/1.jpg',
          createdAt: '2024-01-01T00:00:00.000Z',
          modifiedAt: '2024-01-01T00:00:00.000Z',
          isIndexed: 1,
          embedding: JSON.stringify([0.9, 0.9, 0.9]),
        },
        {
          id: 2,
          uuid: 'uuid-2',
          filePath: '/path/2.jpg',
          createdAt: '2024-01-01T00:00:00.000Z',
          modifiedAt: '2024-01-01T00:00:00.000Z',
          isIndexed: 1,
          embedding: JSON.stringify([0.1, 0.1, 0.1]),
        },
      ];
      mockGetAllAsync.mockResolvedValue(mockRows);

      const queryVector = [0.9, 0.9, 0.9];
      const results = await service.searchByVector(queryVector, 10, 0.9);

      expect(results.length).toBeLessThanOrEqual(2);
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    it('should return database statistics', async () => {
      mockGetFirstAsync
        .mockResolvedValueOnce({ count: 100 })
        .mockResolvedValueOnce({ count: 80 });

      const stats = await service.getStats();

      expect(stats).toEqual({
        totalPhotos: 100,
        indexedPhotos: 80,
        unindexedPhotos: 20,
        databaseSize: 0,
      });
    });
  });

  describe('close', () => {
    it('should close database connection', async () => {
      await service.initialize();
      await service.close();

      expect(mockCloseAsync).toHaveBeenCalled();
    });
  });
});
