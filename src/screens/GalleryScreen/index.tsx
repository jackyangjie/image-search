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
  const { photos, scanPhotos, scanAllPhotos, isScanning, scanProgress, refreshGallery } =
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
        <Text style={styles.stats}>{photos.length} 张照片</Text>
      </View>

      {photos.length === 0 && !isScanning && (
        <EmptyState title="还没有照片" description="点击下方按钮开始扫描相册" />
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
});
