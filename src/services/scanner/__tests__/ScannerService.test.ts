import { ScannerService } from '../ScannerService';
import * as MediaLibrary from 'expo-media-library';
import { DBService } from '@/services/db';
import { AIService } from '@/services/ai';
import { EventBus } from '@/services/event';

describe('ScannerService', () => {
  let service: ScannerService;
  let mockDbService: jest.Mocked<DBService>;
  let mockAiService: jest.Mocked<AIService>;

  const mockAssets = {
    totalCount: 3,
    assets: [
      {
        id: 'asset-1',
        uri: 'file:///photo1.jpg',
        creationTime: Date.now(),
        modificationTime: Date.now(),
        width: 1920,
        height: 1080,
      },
      {
        id: 'asset-2',
        uri: 'file:///photo2.jpg',
        creationTime: Date.now(),
        modificationTime: Date.now(),
        width: 1080,
        height: 1920,
      },
      {
        id: 'asset-3',
        uri: 'file:///photo3.jpg',
        creationTime: Date.now(),
        modificationTime: Date.now(),
        width: 2048,
        height: 1536,
      },
    ],
  };

  beforeEach(() => {
    service = ScannerService.getInstance();
    mockDbService = DBService.getInstance() as jest.Mocked<DBService>;
    mockAiService = AIService.getInstance() as jest.Mocked<AIService>;
  });

  afterEach(() => {
    (ScannerService as unknown as { _instance: null })._instance = null;
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = ScannerService.getInstance();
      const instance2 = ScannerService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getScanState', () => {
    it('should return initial idle state', () => {
      const state = service.getScanState();
      expect(state.status).toBe('idle');
    });
  });

  describe('getProgress', () => {
    it('should return initial progress', () => {
      const progress = service.getProgress();
      expect(progress.total).toBe(0);
      expect(progress.processed).toBe(0);
      expect(progress.indexed).toBe(0);
      expect(progress.failed).toBe(0);
      expect(progress.percent).toBe(0);
    });
  });

  describe('startScan', () => {
    beforeEach(() => {
      (MediaLibrary.getAssetsAsync as jest.Mock).mockResolvedValue(mockAssets);
      mockDbService.getPhotos.mockResolvedValue([]);
      mockDbService.insertPhoto.mockResolvedValue(1);
      mockAiService.encodeImage.mockResolvedValue(new Array(512).fill(0.1));
    });

    it('should scan all photos successfully', async () => {
      const result = await service.startScan();

      expect(result.totalFound).toBe(3);
      expect(result.newlyIndexed).toBe(3);
      expect(result.failed).toBe(0);
      expect(MediaLibrary.getAssetsAsync).toHaveBeenCalledWith({
        mediaType: 'photo',
        first: 10000,
      });
    });

    it('should skip already indexed photos in incremental mode', async () => {
      mockDbService.getPhotos.mockResolvedValue([
        {
          uuid: 'asset-1',
          filePath: 'file:///photo1.jpg',
          id: 1,
          createdAt: new Date(),
          modifiedAt: new Date(),
          isIndexed: true,
        },
      ]);

      const result = await service.startScan({ incremental: true });

      expect(result.totalFound).toBe(3);
      expect(mockAiService.encodeImage).toHaveBeenCalledTimes(2);
    });

    it('should handle scan errors gracefully', async () => {
      (MediaLibrary.getAssetsAsync as jest.Mock).mockRejectedValue(new Error('Permission denied'));

      await expect(service.startScan()).rejects.toThrow('Permission denied');
    });

    it('should emit scan:start event', async () => {
      const startCallback = jest.fn();
      EventBus.on('scan:start', startCallback);

      await service.startScan();

      expect(startCallback).toHaveBeenCalled();
    });

    it('should emit scan:complete event', async () => {
      const completeCallback = jest.fn();
      EventBus.on('scan:complete', completeCallback);

      await service.startScan();

      expect(completeCallback).toHaveBeenCalled();
    });
  });

  describe('pauseScan', () => {
    it('should pause scanning', async () => {
      (MediaLibrary.getAssetsAsync as jest.Mock).mockResolvedValue(mockAssets);
      service.startScan();
      service.pauseScan();

      const state = service.getScanState();
      expect(state.status).toBe('paused');
    });
  });

  describe('resumeScan', () => {
    it('should resume scanning from paused state', async () => {
      (MediaLibrary.getAssetsAsync as jest.Mock).mockResolvedValue(mockAssets);
      mockDbService.getPhotos.mockResolvedValue([]);
      mockDbService.insertPhoto.mockResolvedValue(1);
      mockAiService.encodeImage.mockResolvedValue(new Array(512).fill(0.1));

      await service.startScan();
      service.pauseScan();
      service.resumeScan();

      const state = service.getScanState();
      expect(state.status).not.toBe('paused');
    });
  });

  describe('stopScan', () => {
    it('should stop scanning and reset state', async () => {
      (MediaLibrary.getAssetsAsync as jest.Mock).mockResolvedValue(mockAssets);

      service.startScan();
      service.stopScan();

      const state = service.getScanState();
      expect(state.status).toBe('idle');
    });
  });

  describe('event handling', () => {
    it('should emit scan:error event on failure', async () => {
      (MediaLibrary.getAssetsAsync as jest.Mock).mockRejectedValue(new Error('Test error'));

      const errorCallback = jest.fn();
      EventBus.on('scan:error', errorCallback);

      try {
        await service.startScan();
      } catch {
        // Expected to throw
      }

      expect(errorCallback).toHaveBeenCalled();
    });
  });
});
