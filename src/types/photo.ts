/**
 * @fileoverview 照片相关类型定义
 * @description 定义照片数据模型和查询选项
 */

export interface Photo {
  id?: number;
  uuid: string;
  filePath: string;
  thumbnailPath?: string;
  createdAt: Date;
  modifiedAt: Date;
  width?: number;
  height?: number;
  embedding?: number[];
  isIndexed: boolean;
  fileSize?: number;
}

export interface PhotoQueryOptions {
  offset?: number;
  limit?: number;
  orderBy?: 'createdAt' | 'modifiedAt';
  order?: 'ASC' | 'DESC';
  isIndexed?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface SearchResult {
  photo: Photo;
  similarity: number;
}

export interface DBStats {
  totalPhotos: number;
  indexedPhotos: number;
  unindexedPhotos: number;
  databaseSize: number;
  lastScanAt?: Date;
}

export interface CameraInfo {
  make?: string;
  model?: string;
  aperture?: string;
  exposure?: string;
  iso?: number;
  focalLength?: string;
}

export interface PhotoDetail extends Photo {
  thumbnailUri: string;
  fullSizeUri: string;
  fileSizeFormatted: string;
  dimensions: string;
  cameraInfo?: CameraInfo;
}
