/**
 * @fileoverview 权限服务
 * @description 管理相册和存储权限
 */

import * as MediaLibrary from 'expo-media-library';

export type PermissionStatus = 'granted' | 'denied' | 'limited' | 'notDetermined';

export interface PermissionResult {
  status: PermissionStatus;
  canAskAgain: boolean;
}

export class PermissionService {
  private static _instance: PermissionService | null = null;

  static getInstance(): PermissionService {
    if (!PermissionService._instance) {
      PermissionService._instance = new PermissionService();
    }
    return PermissionService._instance;
  }

  async checkPhotoPermission(): Promise<boolean> {
    try {
      const { status } = await MediaLibrary.getPermissionsAsync();
      return status === MediaLibrary.PermissionStatus.GRANTED;
    } catch (error) {
      console.warn('MediaLibrary permission check failed (Expo Go limitation):', error);
      return true;
    }
  }

  async requestPhotoPermission(): Promise<boolean> {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      return status === MediaLibrary.PermissionStatus.GRANTED;
    } catch (error) {
      console.warn('MediaLibrary permission request failed (Expo Go limitation):', error);
      return true;
    }
  }

  getPermissionGuide(): { title: string; description: string; steps: string[] } {
    return {
      title: '需要相册权限',
      description:
        '为了索引和搜索您的照片，我们需要访问您的相册。您的照片将完全在本地处理，不会上传到任何服务器。',
      steps: [
        '打开系统设置',
        '找到 SmartPhoto Search',
        '点击"照片"',
        '选择"所有照片"或"选中的照片"',
      ],
    };
  }
}
