import * as FileSystem from 'expo-file-system/legacy';
import { SearchOptions, SearchResult, SearchHistoryItem } from '@/types';
import { DBService } from '@/services/db';
import { AIService, AIServiceMock } from '@/services/ai';
import { EventBus } from '@/services/event/EventBus';
import { isExpoGo } from '@/utils/environment';

const SEARCH_HISTORY_KEY = '@smartphoto_search_history';

class FileStorage {
  private getFilePath(): string {
    return (FileSystem.cacheDirectory || '') + 'search_history.json';
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const filePath = this.getFilePath();
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) return null;

      const content = await FileSystem.readAsStringAsync(filePath);
      const data = JSON.parse(content);
      return data[key] || null;
    } catch {
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      let data: Record<string, string> = {};
      const filePath = this.getFilePath();

      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(filePath);
        data = JSON.parse(content);
      }

      data[key] = value;
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to file storage:', error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const filePath = this.getFilePath();
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) return;

      const content = await FileSystem.readAsStringAsync(filePath);
      const data = JSON.parse(content);
      delete data[key];
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to remove from file storage:', error);
    }
  }
}

const AsyncStorage = new FileStorage();

export class SearchService {
  private static _instance: SearchService | null = null;
  private _dbService: DBService;
  private _aiService: AIService | AIServiceMock;

  static getInstance(): SearchService {
    if (!SearchService._instance) {
      SearchService._instance = new SearchService();
    }
    return SearchService._instance;
  }

  constructor() {
    this._dbService = DBService.getInstance();
    this._aiService = isExpoGo() ? AIServiceMock.getInstance() : AIService.getInstance();
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const { limit = 20, threshold = 0.5, timeRange, sortBy = 'similarity' } = options;

    EventBus.emit('search:start', { query });
    const startTime = Date.now();

    try {
      const textEmbedding = await this._aiService.encodeText(query);

      let results = await this._dbService.searchByVector(textEmbedding, limit * 2, threshold);

      if (timeRange) {
        const { start, end } = timeRange;
        results = results.filter(r => {
          const photoDate = r.photo.createdAt;
          if (start && photoDate < start) return false;
          if (end && photoDate > end) return false;
          return true;
        });
      }

      if (sortBy === 'date') {
        results.sort((a, b) => b.photo.createdAt.getTime() - a.photo.createdAt.getTime());
      } else {
        results.sort((a, b) => b.similarity - a.similarity);
      }

      results = results.slice(0, limit);

      await this.addToHistory(query, results.length);

      const duration = Date.now() - startTime;
      EventBus.emit('search:complete', { query, results, duration });

      return results;
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  async advancedSearch(criteria: {
    query?: string;
    timeRange?: { start?: Date; end?: Date };
    limit?: number;
    threshold?: number;
  }): Promise<SearchResult[]> {
    const { query, timeRange, limit = 20, threshold = 0.5 } = criteria;

    if (!query) {
      const allPhotos = await this._dbService.getPhotos({
        limit: limit * 2,
        orderBy: 'createdAt',
        order: 'DESC',
      });

      let results: SearchResult[] = allPhotos.map(p => ({ photo: p, similarity: 1 }));

      if (timeRange) {
        const { start, end } = timeRange;
        results = results.filter(r => {
          const photoDate = r.photo.createdAt;
          if (start && photoDate < start) return false;
          if (end && photoDate > end) return false;
          return true;
        });
      }

      return results.slice(0, limit);
    }

    return this.search(query, { limit, threshold, timeRange });
  }

  async searchByPhoto(photoId: number, limit: number = 20): Promise<SearchResult[]> {
    try {
      const photo = await this._dbService.getPhoto(photoId);

      if (!photo || !photo.embedding) {
        throw new Error('PHOTO_NOT_FOUND_OR_NOT_INDEXED');
      }

      const results = await this._dbService.searchByVector(photo.embedding, limit + 1, 0.3);

      return results.filter(r => r.photo.id !== photoId).slice(0, limit);
    } catch (error) {
      console.error('Search by photo failed:', error);
      throw error;
    }
  }

  async getSearchHistory(): Promise<SearchHistoryItem[]> {
    try {
      const json = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (json) {
        const history = JSON.parse(json) as SearchHistoryItem[];
        return history.map(item => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
      }
      return [];
    } catch (error) {
      console.error('Failed to get search history:', error);
      return [];
    }
  }

  async addToHistory(query: string, resultCount: number): Promise<void> {
    try {
      const history = await this.getSearchHistory();

      const filtered = history.filter(item => item.query !== query);

      filtered.unshift({
        query,
        timestamp: new Date(),
        resultCount,
      });

      const limited = filtered.slice(0, 50);

      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(limited));
    } catch (error) {
      console.error('Failed to add to history:', error);
    }
  }

  async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  }

  getHotSearches(): string[] {
    return ['海边的日落', '猫咪', '美食', '宝宝', '旅行'];
  }
}
