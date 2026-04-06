/**
 * @fileoverview 扫描相关类型定义
 * @description 定义扫描选项、状态和进度类型
 */

export interface ScanOptions {
  incremental?: boolean;
  generateThumbnail?: boolean;
  thumbnailSize?: number;
  batchSize?: number;
  concurrency?: number;
}

export interface ScanState {
  status: 'idle' | 'scanning' | 'paused' | 'completed' | 'error';
  startTime?: Date;
  pauseTime?: Date;
  error?: string;
}

export interface ScanProgress {
  total: number;
  processed: number;
  indexed: number;
  failed: number;
  currentFile?: string;
  percent: number;
  estimatedTimeRemaining?: number;
}

export interface ScanResult {
  totalFound: number;
  newlyIndexed: number;
  failed: number;
  duration: number;
  errors: ScanError[];
}

export interface ScanError {
  filePath: string;
  error: string;
  timestamp: Date;
}
