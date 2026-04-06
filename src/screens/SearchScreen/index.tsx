/**
 * @fileoverview 搜索页面
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SearchBar, PhotoGrid, EmptyState } from '@/components';
import { useAppContext } from '@/context';
import { colors } from '@/constants';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  PhotoDetail: { photoId: number };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function SearchScreen(): React.ReactElement {
  const navigation = useNavigation<NavigationProp>();
  const { searchPhotos, searchResults, isSearching, searchQuery } = useAppContext();

  const handleSearch = useCallback((query: string) => {
    searchPhotos(query);
  }, [searchPhotos]);

  const handlePhotoPress = useCallback((photo: any) => {
    if (photo.id) {
      navigation.navigate('PhotoDetail', { photoId: photo.id });
    }
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>智能相册搜索</Text>
        <SearchBar onSearch={handleSearch} />
      </View>

      {!searchQuery && (
        <ScrollView style={styles.suggestions}>
          <Text style={styles.sectionTitle}>试试搜索</Text>
          <View style={styles.tags}>
            {['海边的日落', '猫咪', '美食', '旅行'].map(tag => (
              <TouchableOpacity
                key={tag}
                style={styles.tag}
                onPress={() => handleSearch(tag)}
              >
                <Text style={styles.tagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {searchQuery && searchResults.length === 0 && !isSearching && (
        <EmptyState
          title="没有找到相关照片"
          description="尝试使用不同的描述词"
        />
      )}

      {searchResults.length > 0 && (
        <PhotoGrid
          photos={searchResults.map(r => r.photo)}
          onPhotoPress={handlePhotoPress}
        />
      )}
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
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.gray900,
  },
  suggestions: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: colors.gray700,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  tagText: {
    color: colors.primary,
    fontSize: 16,
  },
});
