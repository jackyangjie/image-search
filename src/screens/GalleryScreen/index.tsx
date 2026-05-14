/**
 * @fileoverview 相册页面
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { PhotoGrid, EmptyState } from '@/components';
import { useAppContext } from '@/context';
import { colors } from '@/constants';

export function GalleryScreen(): React.ReactElement {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { photos, scanPhotos, scanAllPhotos, isScanning, scanProgress, scanTotal, scanIndexed, scanCurrentFile, refreshGallery, aiModelType, aiModelStatus, isInitialized } =
    useAppContext();

  const handlePhotoPress = useCallback(
    (photo: any) => {
      if (photo.id) {
        navigation.navigate('PhotoDetail', { photoId: photo.id });
      }
    },
    [navigation]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>我的相册</Text>
        <Text style={styles.stats}>{photos.length} 张照片 (已索引: {photos.filter(p => p.isIndexed).length})</Text>
      </View>

      {/* AI模型状态显示 */}
      {isInitialized && (
        <View style={styles.modelStatusContainer}>
          <View style={[
            styles.modelStatusBadge,
            aiModelStatus === 'loaded' ? styles.statusLoaded :
            aiModelStatus === 'mock' ? styles.statusMock : styles.statusUnknown
          ]}>
            <Text style={styles.modelStatusText}>
              AI模型: {aiModelType === 'chinese-clip' ? 'Chinese-CLIP' : 
                      aiModelType === 'siglip2' ? 'SigLIP2' : 
                      aiModelType === 'mock' ? '模拟模式' : aiModelType}
            </Text>
            <Text style={styles.modelStatusSubtext}>
              {aiModelStatus === 'loaded' ? '✓ 真实推理' : 
               aiModelStatus === 'mock' ? '⚠ 模拟模式' : '...初始化中'}
            </Text>
          </View>
        </View>
      )}

      {isScanning && (
        <View style={styles.progressContainer}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              扫描中... {scanIndexed}/{scanTotal} 张
            </Text>
            <Text style={styles.progressPercent}>{Math.round(scanProgress)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${scanProgress}%` }]} />
          </View>
          {scanCurrentFile ? (
            <Text style={styles.currentFile} numberOfLines={1} ellipsizeMode="middle">
              正在处理: {scanCurrentFile.split('/').pop()}
            </Text>
          ) : null}
        </View>
      )}

      {photos.length > 0 && (
        <PhotoGrid
          photos={photos}
          onPhotoPress={handlePhotoPress}
          onRefresh={refreshGallery}
          refreshing={false}
        />
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.scanButton, styles.scanButtonHalf]}
          onPress={scanPhotos}
          disabled={isScanning}
        >
          <Text style={styles.scanButtonText}>
            {isScanning ? `扫描中 ${Math.round(scanProgress)}%` : '扫描相册'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.scanButton, styles.scanButtonHalf, styles.scanAllButton]}
          onPress={scanAllPhotos}
          disabled={isScanning}
        >
          <Text style={styles.scanButtonText}>全选扫描</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray900,
  },
  stats: {
    fontSize: 16,
    color: colors.gray500,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  scanButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  scanButtonHalf: {
    flex: 1,
  },
  scanAllButton: {
    backgroundColor: colors.primaryDark,
  },
  scanButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: colors.gray700,
    fontWeight: '500',
  },
  progressPercent: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.gray200,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  currentFile: {
    fontSize: 12,
    color: colors.gray500,
  },
  modelStatusContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  modelStatusBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusLoaded: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
  },
  statusMock: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  statusUnknown: {
    backgroundColor: '#f3f4f6',
    borderColor: '#9ca3af',
  },
  modelStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  modelStatusSubtext: {
    fontSize: 12,
    color: '#6b7280',
  },
});
