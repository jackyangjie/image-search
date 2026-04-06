/**
 * @fileoverview 照片网格组件
 */

import React, { useCallback } from 'react';
import { FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Photo } from '@/types';
import { PhotoCard } from '../PhotoCard';
import { colors } from '@/constants';

interface PhotoGridProps {
  photos: Photo[];
  onPhotoPress: (photo: Photo) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  onEndReached?: () => void;
}

export function PhotoGrid({
  photos,
  onPhotoPress,
  onRefresh,
  refreshing,
  onEndReached,
}: PhotoGridProps): React.ReactElement {
  const renderItem = useCallback(({ item }: { item: Photo }) => {
    return <PhotoCard photo={item} onPress={onPhotoPress} />;
  }, [onPhotoPress]);

  const keyExtractor = useCallback((item: Photo) => {
    return item.uuid;
  }, []);

  return (
    <FlatList
      data={photos}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={3}
      contentContainerStyle={styles.container}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing || false}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        ) : undefined
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      initialNumToRender={12}
      maxToRenderPerBatch={12}
      windowSize={5}
      removeClippedSubviews={true}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
});
