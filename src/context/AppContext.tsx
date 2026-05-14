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
import { AIService } from '@/services/ai';
import { PermissionService } from '@/services/permission';
import { EventBus } from '@/services/event';

interface AppState {
  photos: Photo[];
  searchResults: SearchResult[];
  isScanning: boolean;
  scanProgress: number;
  scanTotal: number;
  scanProcessed: number;
  scanIndexed: number;
  scanCurrentFile: string;
  searchQuery: string;
  isSearching: boolean;
  isInitialized: boolean;
  aiModelType: string;
  aiModelStatus: string;
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
    scanProcessed: 0,
    scanIndexed: 0,
    scanCurrentFile: '',
    searchQuery: '',
    isSearching: false,
    isInitialized: false,
    aiModelType: 'unknown',
    aiModelStatus: 'initializing',
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
      setState(prev => ({ ...prev, aiModelStatus: 'initializing' }));
      
      // 初始化数据库
      await DBService.getInstance().initialize();

      // 初始化AI服务
      const aiService = AIService.getInstance();
      await aiService.initialize();
      
      // 获取AI模型状态
      const modelType = aiService.getModelType();
      const isAIInitialized = aiService.isInitialized();
      const modelStatus = isAIInitialized ? 'loaded' : 'failed';
      const modelTypeStr = modelType || 'unknown';
      
      console.log(`[Model Status] Type: ${modelTypeStr}, Initialized: ${isAIInitialized}, Status: ${modelStatus}`);
      
      // 获取调试信息
      if ('getDebugInfo' in aiService) {
        const debugInfo = aiService.getDebugInfo();
        console.log('[AI Debug Info]', debugInfo);
      }

      // 加载照片列表
      await refreshGallery();

      setState(prev => ({ 
        ...prev, 
        isInitialized: true,
        aiModelType: modelTypeStr,
        aiModelStatus: modelStatus,
      }));
    } catch (error) {
      console.error('Failed to initialize:', error);
      setState(prev => ({ 
        ...prev, 
        isInitialized: true, 
        aiModelStatus: 'error',
      }));
    }
  }, [refreshGallery]);

  const scanPhotos = useCallback(async () => {
    console.log('[Scan] scanPhotos called');
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
      await scanner.startScan({ limit: 100 });

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
      const result = await scanner.startScanWithPicker({}, true);
      
      if (result.totalFound === 0 && result.duration === 0) {
        console.log('User cancelled photo selection');
        EventBus.emit('scan:cancelled');
      }

      await refreshGallery();
    } catch (error) {
      console.error('Scan all failed:', error);
      EventBus.emit('scan:error', { error });
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
        scanCurrentFile: progress.currentFile || '',
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
