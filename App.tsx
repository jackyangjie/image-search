/**
 * @fileoverview 应用入口
 * @description 包含初始化流程、权限检查和错误边界处理
 */

import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from '@/navigation';
import { AppStateProvider, useAppContext } from '@/context';
import { PermissionService } from '@/services/permission';
import { PermissionGuideScreen } from '@/screens/PermissionGuideScreen';
import { logger } from '@/utils/logger';
import { Colors, Spacing, FontSize } from '@/constants';

// 错误边界组件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('App Error Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>应用出错了</Text>
          <Text style={styles.errorMessage}>{this.state.error?.message || '发生未知错误'}</Text>
          <Text style={styles.errorHint}>请重启应用，如果问题持续存在，请联系支持团队。</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

// 初始化组件
function AppInitializer(): React.ReactElement {
  const { initialize: initAppState, isInitialized: isAppStateInitialized } = useAppContext();
  const [isPermissionChecked, setIsPermissionChecked] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // 检查权限
  const checkPermission = useCallback(async () => {
    try {
      const permissionService = PermissionService.getInstance();
      const hasPhotoPermission = await permissionService.checkPhotoPermission();
      setHasPermission(hasPhotoPermission);
      setIsPermissionChecked(true);
    } catch (error) {
      logger.error('Failed to check permission:', error);
      setInitError('检查权限失败');
    }
  }, []);

  // 初始化应用
  useEffect(() => {
    const init = async () => {
      try {
        setIsInitializing(true);
        setInitError(null);

        // 检查权限
        await checkPermission();

        // 初始化应用状态（即使权限未授予也需要初始化部分功能）
        await initAppState();

        logger.info('App initialization completed');
      } catch (error) {
        logger.error('App initialization failed:', error);
        setInitError('初始化失败，请重启应用');
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, [initAppState, checkPermission]);

  // 权限授予回调
  const handlePermissionGranted = useCallback(async () => {
    await checkPermission();
  }, [checkPermission]);

  // 显示加载状态
  if (isInitializing || !isAppStateInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>正在初始化...</Text>
        {initError && <Text style={styles.errorText}>{initError}</Text>}
      </View>
    );
  }

  // 显示错误状态
  if (initError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>初始化失败</Text>
        <Text style={styles.errorMessage}>{initError}</Text>
      </View>
    );
  }

  // 权限检查完成但未授予
  if (isPermissionChecked && !hasPermission) {
    return <PermissionGuideScreen onPermissionGranted={handlePermissionGranted} />;
  }

  // 正常显示应用
  return (
    <>
      <StatusBar style="auto" />
      <AppNavigator />
    </>
  );
}

export default function App(): React.ReactElement {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AppStateProvider>
          <AppInitializer />
        </AppStateProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: FontSize.sm,
    color: Colors.error,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.error,
    marginBottom: Spacing.md,
  },
  errorMessage: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  errorHint: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
