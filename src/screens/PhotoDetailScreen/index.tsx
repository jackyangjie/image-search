/**
 * @fileoverview 照片详情页面
 */

import React, { useEffect, useState } from 'react';
import { View, Image, Text, StyleSheet, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Photo } from '@/types';
import { DBService } from '@/services/db';
import { colors } from '@/constants';
import { dateUtils } from '@/utils';

export function PhotoDetailScreen(): React.ReactElement {
  const route = useRoute();
  const navigation = useNavigation();
  const { photoId } = route.params as { photoId: number };
  const [photo, setPhoto] = useState<Photo | null>(null);

  useEffect(() => {
    loadPhoto();
  }, [photoId]);

  const loadPhoto = async () => {
    try {
      const dbService = DBService.getInstance();
      const photoData = await dbService.getPhoto(photoId);
      if (photoData) {
        setPhoto(photoData);
        navigation.setOptions({ title: '照片详情' });
      }
    } catch (error) {
      console.error('Failed to load photo:', error);
    }
  };

  if (!photo) {
    return (
      <View style={styles.container}>
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{ uri: photo.filePath }}
        style={styles.image}
        resizeMode="contain"
      />
      
      <View style={styles.infoContainer}>
        <Text style={styles.sectionTitle}>照片信息</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>拍摄时间</Text>
          <Text style={styles.infoValue}>
            {dateUtils.format(photo.createdAt)}
          </Text>
        </View>
        
        {photo.width && photo.height && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>尺寸</Text>
            <Text style={styles.infoValue}>
              {photo.width} x {photo.height}
            </Text>
          </View>
        )}
        
        {photo.fileSize && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>文件大小</Text>
            <Text style={styles.infoValue}>
              {dateUtils.formatFileSize(photo.fileSize)}
            </Text>
          </View>
        )}
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>索引状态</Text>
          <Text style={styles.infoValue}>
            {photo.isIndexed ? '已索引' : '未索引'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  image: {
    width: '100%',
    height: 400,
    backgroundColor: colors.gray200,
  },
  infoContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.gray900,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 16,
    color: colors.gray500,
  },
  infoValue: {
    fontSize: 16,
    color: colors.gray900,
  },
});
