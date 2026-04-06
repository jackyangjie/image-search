/**
 * @fileoverview 全局状态管理
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { Photo, SearchResult, ScanProgress } from '@/types';
import { DBService } from '@/services/db';
import { SearchService } from '@/services/search';
import { ScannerService } from '@/services/scanner';
import { AIService, AIServiceMock } from '@/services/ai';
import { PermissionService } from '@/services/permission';
import { EventBus } from '@/services/event';
import { isExpoGo } from '@/utils/environment';

interface AppState {
  photos: Photo[];
  searchResults: SearchResult[];
  isScanning: boolean;
  scanProgress: number;
  scanTotal: number;
  scanIndexed: number;
  searchQuery: string;
  isSearching: boolean;
  isInitialized: boolean;
}

interface AppContextType extends AppState {
  initialize: () => Promise<void>;
  scanPhotos: () => Promise<void>;
  scanAllPhotos: () => Promise<void>;
  searchPhotos: (query: string) => Promise<void>;
  refreshGallery: () => Promise<void>;
  setSearchQuery: (query: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppStateProviderProps {
  children: ReactNode;
}

export function AppStateProvider({ children }: AppStateProviderProps): React.ReactElement {
  const [state, setState] = useState<AppState>({
    photos: [],
    searchResults: [],
    isScanning: false,
    scanProgress: 0,
    scanTotal: 0,
    scanIndexed: 0,
    searchQuery: '',
    isSearching: false,
    isInitialized: false,
  });

  const refreshGallery = useCallback(async () => {
    try {
      const dbService = DBService.getInstance();
      const photos = await dbService.getPhotos({ limit: 100 });
      setState(prev => ({ ...prev, photos }));
    } catch (error) {
      console.error('Failed to refresh gallery:', error);
    }
  }, []);

  const initialize = useCallback(async () => {
    try {
      // 初始化数据库
      await DBService.getInstance().initialize();

      // 初始化AI服务（Expo Go 使用 Mock）
      const aiService = isExpoGo() ? AIServiceMock.getInstance() : AIService.getInstance();
      await aiService.initialize();

      // 加载照片列表
      await refreshGallery();

      setState(prev => ({ ...prev, isInitialized: true }));
    } catch (error) {
      console.error('Failed to initialize:', error);
    }
  }, [refreshGallery]);

  const scanPhotos = useCallback(async () => {
    try {
      const permissionService = PermissionService.getInstance();
      const hasPermission = await permissionService.checkPhotoPermission();

      if (!hasPermission) {
        const granted = await permissionService.requestPhotoPermission();
        if (!granted) {
          console.warn('Photo permission denied');
          EventBus.emit('scan:error', { error: new Error('PHOTO_PERMISSION_DENIED') });
          return;
        }
      }

      setState(prev => ({ ...prev, isScanning: true }));

      const scanner = ScannerService.getInstance();
      await scanner.startScan();

      // 扫描完成后刷新
      await refreshGallery();
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setState(prev => ({ ...prev, isScanning: false }));
    }
  }, [refreshGallery]);

  const scanAllPhotos = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isScanning: true }));

      const scanner = ScannerService.getInstance();
      await scanner.startScanWithPicker({}, true);

      await refreshGallery();
    } catch (error) {
      console.error('Scan all failed:', error);
    } finally {
      setState(prev => ({ ...prev, isScanning: false }));
    }
  }, [refreshGallery]);

  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const searchPhotos = useCallback(async (query: string) => {
    if (!query.trim()) return;

    try {
      setState(prev => ({ ...prev, isSearching: true, searchQuery: query }));

      const searchService = SearchService.getInstance();
      const results = await searchService.search(query);

      setState(prev => ({ ...prev, searchResults: results }));
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setState(prev => ({ ...prev, isSearching: false }));
    }
  }, []);

  // 监听扫描进度
  useEffect(() => {
    const handleProgress = (progress: ScanProgress) => {
      setState(prev => ({
        ...prev,
        scanProgress: progress.percent,
        scanTotal: progress.total,
        scanIndexed: progress.indexed,
      }));
    };

    EventBus.on('scan:progress', handleProgress);

    return () => EventBus.off('scan:progress', handleProgress);
  }, []);

  const value: AppContextType = {
    ...state,
    initialize,
    scanPhotos,
    scanAllPhotos,
    searchPhotos,
    refreshGallery,
    setSearchQuery,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppStateProvider');
  }
  return context;
}
