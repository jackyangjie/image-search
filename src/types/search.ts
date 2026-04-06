/**
 * @fileoverview 搜索相关类型定义
 * @description 定义搜索选项、结果和历史记录类型
 */

export interface SearchOptions {
  limit?: number;
  threshold?: number;
  timeRange?: TimeRange;
  sortBy?: 'similarity' | 'date';
}

export interface TimeRange {
  start?: Date;
  end?: Date;
}

export interface SearchCriteria {
  query?: string;
  timeRange?: TimeRange;
  minSimilarity?: number;
  tags?: string[];
}

export interface SearchHistoryItem {
  query: string;
  timestamp: Date;
  resultCount: number;
}
