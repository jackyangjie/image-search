/**
 * @fileoverview 图片选择服务
 * @description 批量选择图片功能
 */

import * as ImagePicker from 'expo-image-picker';
import { logger } from '@/utils/logger';

export interface ImagePickerOptions {
  selectionLimit?: number; // 最多选择数量，0为无限制
  allowsEditing?: boolean; // 是否允许编辑
  quality?: number; // 图片质量 0-1
}

export interface PickedImage {
  uri: string;
  width: number;
  height: number;
  fileName?: string;
  fileSize?: number;
}

export class ImagePickerService {
  private static _instance: ImagePickerService | null = null;

  static getInstance(): ImagePickerService {
    if (!ImagePickerService._instance) {
      ImagePickerService._instance = new ImagePickerService();
    }
    return ImagePickerService._instance;
  }

  /**
   * 批量选择图片
   * @param options 选择配置
   * @returns 选中的图片数组，用户取消返回空数组
   */
  async pickImages(options: ImagePickerOptions = {}): Promise<PickedImage[]> {
    const { selectionLimit = 50, allowsEditing = false, quality = 0.8 } = options;

    try {
      // 请求权限
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        logger.warn('Image picker permission denied');
        return [];
      }

      // 打开图片选择器
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit,
        allowsEditing,
        quality,
      });

      if (result.canceled) {
        logger.debug('Image picker cancelled');
        return [];
      }

      // 转换结果
      const images: PickedImage[] = result.assets.map(asset => ({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        fileName: asset.fileName || undefined,
        fileSize: asset.fileSize,
      }));

      logger.info(`Selected ${images.length} images`);
      return images;
    } catch (error) {
      logger.error('Failed to pick images:', error);
      return [];
    }
  }

  /**
   * 选择单张图片
   * @param options 选择配置
   * @returns 选中的图片，用户取消返回 null
   */
  async pickSingleImage(
    options: Omit<ImagePickerOptions, 'selectionLimit'> = {}
  ): Promise<PickedImage | null> {
    const images = await this.pickImages({ ...options, selectionLimit: 1 });
    return images[0] || null;
  }
}
