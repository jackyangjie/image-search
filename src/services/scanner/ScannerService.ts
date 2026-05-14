import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { Photo, ScanOptions, ScanState, ScanProgress, ScanResult, ScanError } from '@/types';
import { DBService } from '@/services/db';
import { AIService } from '@/services/ai';
import { PhotoService } from '@/services/photo';
import { EventBus } from '@/services/event/EventBus';

/** 为 Promise 添加超时，超时后 reject */
function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMsg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMsg)), ms)
    ),
  ]);
}

export class ScannerService {
  private static _instance: ScannerService | null = null;
  private _dbService: DBService;
  private _aiService: AIService;
  private _photoService: PhotoService;
  private _state: ScanState = { status: 'idle' };
  private _progress: ScanProgress = { total: 0, processed: 0, indexed: 0, failed: 0, percent: 0 };
  private _abortController: AbortController | null = null;

  static getInstance(): ScannerService {
    if (!ScannerService._instance) {
      ScannerService._instance = new ScannerService();
    }
    return ScannerService._instance;
  }

  constructor() {
    this._dbService = DBService.getInstance();
    this._aiService = AIService.getInstance();
    this._photoService = PhotoService.getInstance();
  }

  async startScan(options: ScanOptions = {}): Promise<ScanResult> {
    const { incremental = true, generateThumbnail = true, batchSize = 10, limit } = options;

    this._state = { status: 'scanning', startTime: new Date() };
    this._progress = { total: 0, processed: 0, indexed: 0, failed: 0, percent: 0 };
    this._abortController = new AbortController();

    const startTime = Date.now();
    const errors: ScanError[] = [];

    try {
      console.log('[Scan] startScan: emitting scan:start');
      EventBus.emit('scan:start');

      console.log('[Scan] startScan: fetching assets from MediaLibrary...');
      // 分页获取所有照片
      const allAssets: MediaLibrary.Asset[] = [];
      let hasNextPage = true;
      let after: string | undefined;

      try {
        while (hasNextPage) {
          console.log(`[Scan] getAssetsAsync page (after=${after || 'initial'})...`);
          const result = await MediaLibrary.getAssetsAsync({
            mediaType: 'photo',
            first: 500,
            after,
          });
          allAssets.push(...result.assets);
          hasNextPage = result.hasNextPage;
          after = result.endCursor;
          console.log(`[Scan] getAssetsAsync returned ${result.assets.length} assets, hasNextPage=${hasNextPage}, total=${allAssets.length}`);

          // 获取照片阶段就更新进度，让用户看到进度在动
          this._progress.total = allAssets.length;
          this._progress.currentFile = `正在读取照片列表 (${allAssets.length} 张)...`;
          this._emitProgress();
        }
        console.log(`[Scan] Total assets fetched: ${allAssets.length}`);
      } catch (error) {
        console.warn(
          'MediaLibrary.getAssetsAsync failed (Expo Go limitation), switching to ImagePicker mode:',
          error
        );
        return await this.startScanWithPicker(options);
      }

      // 过滤已索引的照片
      let photosToProcess = allAssets;
      if (incremental) {
        const existingUuids = new Set<string>();
        const existingPhotos = await this._dbService.getPhotos({ limit: 10000 });
        for (const photo of existingPhotos) {
          existingUuids.add(photo.uuid);
        }
        photosToProcess = allAssets.filter(a => !existingUuids.has(a.id));
      }

      // 限制处理数量（调试用）
      if (limit && photosToProcess.length > limit) {
        photosToProcess = photosToProcess.slice(0, limit);
      }

      if (photosToProcess.length === 0) {
        const result: ScanResult = {
          totalFound: allAssets.length,
          newlyIndexed: 0,
          failed: 0,
          duration: 0,
          errors: [],
        };
        this._state = { status: 'completed' };
        EventBus.emit('scan:complete', result);
        return result;
      }

      this._progress.total = photosToProcess.length;
      this._emitProgress();

      await this._processPhotos(photosToProcess, { generateThumbnail, batchSize }, errors);

      this._progress.percent = 100;
      this._emitProgress();

      const duration = (Date.now() - startTime) / 1000;
      const result: ScanResult = {
        totalFound: allAssets.length,
        newlyIndexed: this._progress.indexed,
        failed: this._progress.failed,
        duration,
        errors,
      };

      this._state = { status: 'completed' };
      EventBus.emit('scan:complete', result);

      return result;
    } catch (error) {
      this._state = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      EventBus.emit('scan:error', { error });
      throw error;
    }
  }

  // 图片选择器模式（Expo Go 兼容）
  async startScanWithPicker(options: ScanOptions = {}, selectAll = false): Promise<ScanResult> {
    const { incremental = true, generateThumbnail = true, batchSize = 10 } = options;

    this._state = { status: 'scanning', startTime: new Date() };
    this._progress = { total: 0, processed: 0, indexed: 0, failed: 0, percent: 0 };
    this._abortController = new AbortController();

    const startTime = Date.now();
    const errors: ScanError[] = [];

    try {
      EventBus.emit('scan:start');

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Image picker permission denied');
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: selectAll ? 0 : 50,
        quality: 0.8,
      });

      if (pickerResult.canceled || pickerResult.assets.length === 0) {
        this._state = { status: 'idle' };
        return {
          totalFound: 0,
          newlyIndexed: 0,
          failed: 0,
          duration: 0,
          errors: [],
        };
      }

      const assets: MediaLibrary.Asset[] = pickerResult.assets.map(
        asset =>
          ({
            id: asset.assetId || `picked-${Date.now()}-${Math.random()}`,
            uri: asset.uri,
            mediaType: 'photo' as const,
            width: asset.width,
            height: asset.height,
            creationTime: Date.now(),
            modificationTime: Date.now(),
            duration: 0,
            albumId: undefined,
            filename: asset.fileName || 'unknown.jpg',
          }) as MediaLibrary.Asset
      );

      // 过滤已索引的照片
      let photosToProcess = assets;
      if (incremental) {
        const existingUuids = new Set<string>();
        const existingPhotos = await this._dbService.getPhotos({ limit: 10000 });
        for (const photo of existingPhotos) {
          existingUuids.add(photo.uuid);
        }
        photosToProcess = assets.filter(a => !existingUuids.has(a.id));
      }

      if (photosToProcess.length === 0) {
        this._state = { status: 'completed' };
        const result: ScanResult = {
          totalFound: assets.length,
          newlyIndexed: 0,
          failed: 0,
          duration: 0,
          errors: [],
        };
        EventBus.emit('scan:complete', result);
        return result;
      }

      this._progress.total = photosToProcess.length;
      this._emitProgress();

      await this._processPhotos(photosToProcess, { generateThumbnail, batchSize }, errors);

      this._progress.percent = 100;
      this._emitProgress();

      const duration = (Date.now() - startTime) / 1000;
      const result: ScanResult = {
        totalFound: assets.length,
        newlyIndexed: this._progress.indexed,
        failed: this._progress.failed,
        duration,
        errors,
      };

      this._state = { status: 'completed' };
      EventBus.emit('scan:complete', result);

      return result;
    } catch (error) {
      this._state = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      EventBus.emit('scan:error', { error });
      throw error;
    }
  }

  // 批量处理照片（提取的公共方法，支持并发）
  private async _processPhotos(
    photosToProcess: MediaLibrary.Asset[],
    options: { generateThumbnail: boolean; batchSize: number },
    errors: ScanError[]
  ): Promise<void> {
    const { generateThumbnail, batchSize } = options;
    const CONCURRENCY = 4; // 同时处理4张照片
    let totalProcessed = 0;

    // 将照片分批并发处理
    for (let start = 0; start < photosToProcess.length; start += CONCURRENCY) {
      if (this._abortController?.signal.aborted) {
        throw new Error('SCAN_CANCELLED');
      }

      const chunk = photosToProcess.slice(start, start + CONCURRENCY);

      // 显示当前正在处理的文件名（取批次中第一个文件的名称）
      this._progress.currentFile = chunk[0]?.uri || '';
      this._emitProgress();

      // 并发处理当前批次的照片
      const results = await Promise.allSettled(
        chunk.map(async (asset) => {
          try {
            // 处理单张照片（AI编码 + 缩略图）
            const photo = await this._processSingleAsset(asset, errors);

            // 缩略图生成
            if (generateThumbnail) {
              try {
                const thumbnailPath = await this._photoService.generateThumbnail(asset.uri);
                photo.thumbnailPath = thumbnailPath;
              } catch (thumbError) {
                console.warn('Failed to generate thumbnail:', thumbError);
              }
            }
            return photo;
          } catch (error) {
            console.error('Failed to process photo:', error);
            this._progress.failed++;
            errors.push({
              filePath: asset.uri,
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date(),
            });
            return null;
          }
        })
      );

      // 收集成功的照片
      const batch: Photo[] = [];
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          batch.push(result.value);
          totalProcessed++;
          this._progress.processed++;
        }
      }

      // 写入数据库
      if (batch.length > 0) {
        await this._dbService.insertPhotos(batch);
      }

      // 更新进度：已处理数量 / 总数量
      this._progress.percent = Math.round(
        (totalProcessed / this._progress.total) * 100
      );
      this._progress.currentFile = '';
      if (start % (batchSize * CONCURRENCY) === 0 || start + CONCURRENCY >= photosToProcess.length) {
        this._emitProgress();
      }
    }
  }

  // 处理单张照片（AI编码 + 创建记录）
  private async _processSingleAsset(
    asset: MediaLibrary.Asset,
    errors: ScanError[]
  ): Promise<Photo> {
    const photo: Photo = {
      uuid: asset.id,
      filePath: asset.uri,
      createdAt: asset.creationTime ? new Date(asset.creationTime) : new Date(),
      modifiedAt: asset.modificationTime ? new Date(asset.modificationTime) : new Date(),
      width: asset.width,
      height: asset.height,
      isIndexed: false,
    };

    try {
      // 使用超时保护，防止 AI 推理挂起导致扫描永久卡住
      const TIMEOUT_MS = 60000; // 每张照片最多处理60秒
      const embedding = await withTimeout(
        this._aiService.encodeImage(asset.uri),
        TIMEOUT_MS,
        `AI encoding timed out for ${asset.uri}`
      );
      photo.embedding = embedding;
      photo.isIndexed = true;
      this._progress.indexed++;
    } catch (error) {
      console.warn('Failed to encode image:', error);
      this._progress.failed++;
      errors.push({
        filePath: asset.uri,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      });
      photo.isIndexed = false;
      photo.embedding = undefined;
    }

    return photo;
  }

  pauseScan(): void {
    if (this._state.status === 'scanning') {
      this._state = { ...this._state, status: 'paused', pauseTime: new Date() };
      EventBus.emit('scan:pause');
    }
  }

  resumeScan(): void {
    if (this._state.status === 'paused') {
      this._state = { ...this._state, status: 'scanning' };
      EventBus.emit('scan:resume');
    }
  }

  stopScan(): void {
    if (this._abortController) {
      this._abortController.abort();
    }
    this._state = { status: 'idle' };
    EventBus.emit('scan:stop');
  }

  getScanState(): ScanState {
    return { ...this._state };
  }

  getProgress(): ScanProgress {
    return { ...this._progress };
  }

  private _emitProgress(): void {
    EventBus.emit('scan:progress', { ...this._progress });
  }
}
