/**
 * @fileoverview 照片卡片组件
 */

import React, { memo } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Photo } from '@/types';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 16 * 4) / 3;

interface PhotoCardProps {
  photo: Photo;
  onPress?: (photo: Photo) => void;
  onLongPress?: (photo: Photo) => void;
}

export const PhotoCard = memo(function PhotoCard({
  photo,
  onPress,
  onLongPress,
}: PhotoCardProps): React.ReactElement {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(photo)}
      onLongPress={() => onLongPress?.(photo)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: photo.thumbnailPath || photo.filePath }}
        style={styles.image}
        resizeMode="cover"
      />
      {!photo.isIndexed && (
        <View style={styles.unindexedBadge} />
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    margin: 4,
  },
  image: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 4,
    backgroundColor: '#E5E5E5',
  },
  unindexedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
});
