/**
 * @fileoverview 扫描服务
 * @description 扫描相册并建立索引
 */

import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import { v4 as uuidv4 } from 'uuid';
import { Photo, ScanOptions, ScanState, ScanProgress, ScanResult, ScanError } from '@/types';
import { DBService } from '@/services/db';
import { AIService, AIServiceMock } from '@/services/ai';
import { EventBus } from '@/services/event/EventBus';
import { isExpoGo } from '@/utils/environment';

export class ScannerService {
  private static _instance: ScannerService | null = null;
  private _dbService: DBService;
  private _aiService: AIService | AIServiceMock;
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
    this._aiService = isExpoGo() ? AIServiceMock.getInstance() : AIService.getInstance();
  }

  async startScan(options: ScanOptions = {}): Promise<ScanResult> {
    const { incremental = true, generateThumbnail = true, batchSize = 10 } = options;

    this._state = { status: 'scanning', startTime: new Date() };
    this._progress = { total: 0, processed: 0, indexed: 0, failed: 0, percent: 0 };
    this._abortController = new AbortController();

    const startTime = Date.now();
    const errors: ScanError[] = [];

    try {
      EventBus.emit('scan:start');

      // 获取所有照片（Expo Go 环境下使用 ImagePicker）
      let assets: { totalCount: number; assets: MediaLibrary.Asset[] };
      try {
        assets = await MediaLibrary.getAssetsAsync({
          mediaType: 'photo',
          first: 10000,
        });
      } catch (error) {
        console.warn(
          'MediaLibrary.getAssetsAsync failed (Expo Go limitation), switching to ImagePicker mode:',
          error
        );
        // Expo Go 环境下切换到 ImagePicker 模式
        return await this.startScanWithPicker(options);
      }

      this._progress.total = assets.totalCount;
      this._emitProgress();

      // 过滤已索引的照片
      let photosToProcess = assets.assets;
      if (incremental) {
        const existingUuids = new Set<string>();
        const existingPhotos = await this._dbService.getPhotos({ limit: 10000 });
        for (const photo of existingPhotos) {
          existingUuids.add(photo.uuid);
        }
        photosToProcess = assets.assets.filter(a => !existingUuids.has(a.id));
      }

      // 处理每张照片
      for (let i = 0; i < photosToProcess.length; i++) {
        if (this._abortController?.signal.aborted) {
          throw new Error('SCAN_CANCELLED');
        }

        const asset = photosToProcess[i];
        this._progress.currentFile = asset.uri;

        try {
          // 创建照片记录
          const photo: Photo = {
            uuid: asset.id,
            filePath: asset.uri,
            createdAt: asset.creationTime ? new Date(asset.creationTime) : new Date(),
            modifiedAt: asset.modificationTime ? new Date(asset.modificationTime) : new Date(),
            width: asset.width,
            height: asset.height,
            isIndexed: false,
          };

          // AI向量化
          try {
            const embedding = await this._aiService.encodeImage(asset.uri);
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
          }

          await this._dbService.insertPhoto(photo);
          this._progress.processed++;
          this._progress.percent = Math.round(
            (this._progress.processed / this._progress.total) * 100
          );

          // 每处理batchSize张发送一次进度
          if (i % batchSize === 0) {
            this._emitProgress();
          }
        } catch (error) {
          console.error('Failed to process photo:', error);
          this._progress.failed++;
          errors.push({
            filePath: asset.uri,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date(),
          });
        }
      }

      this._progress.percent = 100;
      this._emitProgress();

      const duration = (Date.now() - startTime) / 1000;
      const result: ScanResult = {
        totalFound: this._progress.total,
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

  // Expo Go 环境下生成模拟照片数据
  private _getMockAssets(): { totalCount: number; assets: MediaLibrary.Asset[] } {
    const mockAssets: MediaLibrary.Asset[] = [];
    const mockCount = 5; // 生成5张模拟照片

    for (let i = 0; i < mockCount; i++) {
      mockAssets.push({
        id: `mock-photo-${i}`,
        uri: `https://picsum.photos/400/300?random=${i}`,
        mediaType: 'photo',
        width: 400,
        height: 300,
        creationTime: Date.now() - i * 86400000, // 每天一张
        modificationTime: Date.now(),
        duration: 0,
        albumId: 'mock-album',
        filename: `mock-photo-${i}.jpg`,
      } as MediaLibrary.Asset);
    }

    return {
      totalCount: mockCount,
      assets: mockAssets,
    };
  }

  /**
   * 使用 ImagePicker 手动选择照片进行扫描（Expo Go 兼容模式）
   * @param options 扫描选项
   * @param selectAll 是否全选模式（selectionLimit=0 表示无限制）
   * @returns 扫描结果
   */
  async startScanWithPicker(options: ScanOptions = {}, selectAll = false): Promise<ScanResult> {
    const { incremental = true, batchSize = 10 } = options;

    this._state = { status: 'scanning', startTime: new Date() };
    this._progress = { total: 0, processed: 0, indexed: 0, failed: 0, percent: 0 };
    this._abortController = new AbortController();

    const startTime = Date.now();
    const errors: ScanError[] = [];

    try {
      EventBus.emit('scan:start');

      // 请求权限并打开图片选择器
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Image picker permission denied');
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: selectAll ? 0 : 50, // 0 表示无限制
        quality: 1,
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

      this._progress.total = pickerResult.assets.length;
      this._emitProgress();

      // 转换 assets 格式
      const assets = pickerResult.assets.map(
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

      // 处理每张照片
      for (let i = 0; i < photosToProcess.length; i++) {
        if (this._abortController?.signal.aborted) {
          throw new Error('SCAN_CANCELLED');
        }

        const asset = photosToProcess[i];
        this._progress.currentFile = asset.uri;

        try {
          // 创建照片记录
          const photo: Photo = {
            uuid: asset.id,
            filePath: asset.uri,
            createdAt: asset.creationTime ? new Date(asset.creationTime) : new Date(),
            modifiedAt: asset.modificationTime ? new Date(asset.modificationTime) : new Date(),
            width: asset.width,
            height: asset.height,
            isIndexed: false,
          };

          // AI向量化
          try {
            const embedding = await this._aiService.encodeImage(asset.uri);
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
          }

          await this._dbService.insertPhoto(photo);
          this._progress.processed++;
          this._progress.percent = Math.round(
            (this._progress.processed / this._progress.total) * 100
          );

          // 每处理batchSize张发送一次进度
          if (i % batchSize === 0) {
            this._emitProgress();
          }
        } catch (error) {
          console.error('Failed to process photo:', error);
          this._progress.failed++;
          errors.push({
            filePath: asset.uri,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date(),
          });
        }
      }

      this._progress.percent = 100;
      this._emitProgress();

      const duration = (Date.now() - startTime) / 1000;
      const result: ScanResult = {
        totalFound: this._progress.total,
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
}
