import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { logger } from '@/utils/logger';
import { DBService } from '@/services/db/DBService';
import { Photo, PhotoDetail } from '@/types';

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number;
}

export class PhotoService {
  private static _instance: PhotoService | null = null;
  private _thumbnailCacheDir: string;

  static getInstance(): PhotoService {
    if (!PhotoService._instance) {
      PhotoService._instance = new PhotoService();
    }
    return PhotoService._instance;
  }

  constructor() {
    this._thumbnailCacheDir = (FileSystem.cacheDirectory || '') + 'thumbnails/';
    this._ensureCacheDir();
  }

  private async _ensureCacheDir(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(this._thumbnailCacheDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this._thumbnailCacheDir, {
        intermediates: true,
      });
      logger.info('Created thumbnail cache directory');
    }
  }

  async generateThumbnail(photoUri: string, options: ThumbnailOptions = {}): Promise<string> {
    const { width = 300, height = 300, quality = 85 } = options;

    try {
      const thumbnailUri = await this._getThumbnailPath(photoUri);
      const fileInfo = await FileSystem.getInfoAsync(thumbnailUri);

      if (fileInfo.exists) {
        logger.debug('Using cached thumbnail:', thumbnailUri);
        return thumbnailUri;
      }

      const manipulatedImage = await ImageManipulator.manipulateAsync(
        photoUri,
        [{ resize: { width, height } }],
        { compress: quality / 100, format: ImageManipulator.SaveFormat.JPEG }
      );

      await FileSystem.copyAsync({
        from: manipulatedImage.uri,
        to: thumbnailUri,
      });

      logger.info('Generated thumbnail:', thumbnailUri);
      return thumbnailUri;
    } catch (error) {
      logger.error('Failed to generate thumbnail:', error);
      throw new Error('THUMBNAIL_GENERATION_FAILED');
    }
  }

  private async _getThumbnailPath(photoUri: string): Promise<string> {
    const filename = photoUri.split('/').pop() || 'thumbnail';
    const hash = await this._simpleHash(filename);
    return `${this._thumbnailCacheDir}${hash}.jpg`;
  }

  private async _simpleHash(str: string): Promise<string> {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  async getPhotoInfo(photoUri: string): Promise<{
    width: number;
    height: number;
    size: number;
  }> {
    try {
      const imageInfo = await ImageManipulator.manipulateAsync(photoUri, []);
      const fileInfo = await FileSystem.getInfoAsync(photoUri);

      return {
        width: imageInfo.width,
        height: imageInfo.height,
        size: fileInfo.exists && 'size' in fileInfo ? (fileInfo as { size?: number }).size || 0 : 0,
      };
    } catch (error) {
      logger.error('Failed to get photo info:', error);
      throw new Error('PHOTO_INFO_FAILED');
    }
  }

  async getPhotoDetail(photoId: number): Promise<PhotoDetail | null> {
    try {
      const db = DBService.getInstance();
      const photo = await db.getPhoto(photoId);

      if (!photo) {
        return null;
      }

      const info = await this.getPhotoInfo(photo.filePath);
      const fileSizeFormatted = this._formatFileSize(info.size);
      const dimensions = `${info.width} x ${info.height}`;

      return {
        ...photo,
        thumbnailUri: photo.thumbnailPath || photo.filePath,
        fullSizeUri: photo.filePath,
        fileSizeFormatted,
        dimensions,
      };
    } catch (error) {
      logger.error('Failed to get photo detail:', error);
      throw new Error('PHOTO_DETAIL_FAILED');
    }
  }

  async deletePhoto(photoId: number): Promise<void> {
    try {
      const db = DBService.getInstance();
      const photo = await db.getPhoto(photoId);

      if (!photo) {
        throw new Error('PHOTO_NOT_FOUND');
      }

      if (photo?.thumbnailPath) {
        await this.deleteThumbnail(photo.filePath);
      }

      await db.deletePhoto(photoId);

      logger.info('Deleted photo:', photoId);
    } catch (error) {
      logger.error('Failed to delete photo:', error);
      throw new Error('PHOTO_DELETE_FAILED');
    }
  }

  async deletePhotos(photoIds: number[]): Promise<void> {
    try {
      const db = DBService.getInstance();

      for (const id of photoIds) {
        const photo = await db.getPhoto(id);
        if (photo?.thumbnailPath) {
          await this.deleteThumbnail(photo.filePath);
        }
      }

      await db.deletePhotos(photoIds);

      logger.info('Deleted photos:', photoIds.length);
    } catch (error) {
      logger.error('Failed to delete photos:', error);
      throw new Error('PHOTOS_DELETE_FAILED');
    }
  }

  async sharePhoto(photoId: number): Promise<void> {
    try {
      const db = DBService.getInstance();
      const photo = await db.getPhoto(photoId);

      if (!photo) {
        throw new Error('PHOTO_NOT_FOUND');
      }

      if (!(await Sharing.isAvailableAsync())) {
        throw new Error('SHARING_NOT_AVAILABLE');
      }

      await Sharing.shareAsync(photo.filePath);
      logger.info('Shared photo:', photoId);
    } catch (error) {
      logger.error('Failed to share photo:', error);
      throw new Error('PHOTO_SHARE_FAILED');
    }
  }

  async sharePhotos(photoIds: number[]): Promise<void> {
    try {
      const db = DBService.getInstance();
      const fileUris: string[] = [];

      for (const id of photoIds) {
        const photo = await db.getPhoto(id);
        if (photo) {
          fileUris.push(photo.filePath);
        }
      }

      if (fileUris.length === 0) {
        throw new Error('NO_PHOTOS_TO_SHARE');
      }

      if (!(await Sharing.isAvailableAsync())) {
        throw new Error('SHARING_NOT_AVAILABLE');
      }

      await Sharing.shareAsync(fileUris[0]);
      logger.info('Shared photos:', fileUris.length);
    } catch (error) {
      logger.error('Failed to share photos:', error);
      throw new Error('PHOTOS_SHARE_FAILED');
    }
  }

  private _formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async deleteThumbnail(photoUri: string): Promise<void> {
    try {
      const thumbnailPath = await this._getThumbnailPath(photoUri);
      await FileSystem.deleteAsync(thumbnailPath, { idempotent: true });
      logger.info('Deleted thumbnail:', thumbnailPath);
    } catch (error) {
      logger.error('Failed to delete thumbnail:', error);
    }
  }

  async clearThumbnailCache(): Promise<void> {
    try {
      const files = await FileSystem.readDirectoryAsync(this._thumbnailCacheDir);
      for (const file of files) {
        await FileSystem.deleteAsync(`${this._thumbnailCacheDir}${file}`, {
          idempotent: true,
        });
      }
      logger.info('Cleared thumbnail cache');
    } catch (error) {
      logger.error('Failed to clear thumbnail cache:', error);
    }
  }

  async getCacheSize(): Promise<number> {
    try {
      const files = await FileSystem.readDirectoryAsync(this._thumbnailCacheDir);
      let totalSize = 0;
      for (const file of files) {
        const info = await FileSystem.getInfoAsync(`${this._thumbnailCacheDir}${file}`);
        if (info.exists && 'size' in info) {
          totalSize += (info as { size?: number }).size || 0;
        }
      }
      return totalSize;
    } catch (error) {
      logger.error('Failed to get cache size:', error);
      return 0;
    }
  }
}
