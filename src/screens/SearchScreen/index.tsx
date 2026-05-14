/**
 * @fileoverview 搜索页面
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SearchBar, PhotoGrid, EmptyState } from '@/components';
import { useAppContext } from '@/context';
import { AIService } from '@/services/ai';
import { DBService } from '@/services/db';
import { SearchService } from '@/services/search';
import { colors } from '@/constants';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  PhotoDetail: { photoId: number };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function SearchScreen(): React.ReactElement {
  const navigation = useNavigation<NavigationProp>();
  const { searchPhotos, searchResults, isSearching, searchQuery, photos } = useAppContext();
  const [dbgCount, setDbgCount] = useState<{total:number, indexed:number, hasEmbed:number} | null>(null);
  const [autoSearchDone, setAutoSearchDone] = useState(false);
  const [debugSearchResult, setDebugSearchResult] = useState<string>('');

  // Auto-trigger search for testing
  useEffect(() => {
    if (!autoSearchDone) {
      const timer = setTimeout(() => {
        console.log('[AutoSearch] Triggering auto search for "风景"');
        searchPhotos('风景').catch(e => console.log('[AutoSearch] Error:', e));
        setAutoSearchDone(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [autoSearchDone, searchPhotos]);

  // Query DB stats on mount
  useEffect(() => {
    (async () => {
      try {
        const db = DBService.getInstance();
        const allRows = await (db as any).getAllAsync?.('SELECT COUNT(*) as total, SUM(CASE WHEN isIndexed = 1 THEN 1 ELSE 0 END) as indexedCount, SUM(CASE WHEN embedding IS NOT NULL THEN 1 ELSE 0 END) as withEmbedding FROM photos');
        if (allRows?.[0]) {
          setDbgCount({ total: allRows[0].total, indexed: allRows[0].indexedCount, hasEmbed: allRows[0].withEmbedding });
          console.log(`[Debug] DB: total=${allRows[0].total}, indexed=${allRows[0].indexedCount}, hasEmbed=${allRows[0].withEmbedding}`);
        }
      } catch (e) {
        console.log('[Debug] DB query failed:', e);
      }
    })();
  }, []);

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
                onPress={() => {
                  console.log(`[Debug] Tag pressed: ${tag}`);
                  handleSearch(tag);
                }}
              >
                <Text style={styles.tagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.tag, { backgroundColor: '#dc3545', marginTop: 16, alignSelf: 'center' }]}
            onPress={() => handleSearch('风景')}
          >
            <Text style={[styles.tagText, { color: '#fff' }]}>🔍 测试搜索"风景"</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {searchQuery && searchResults.length === 0 && !isSearching && (
        <View>
          <EmptyState
            title="没有找到相关照片"
            description="尝试使用不同的描述词"
          />
          {dbgCount && (
            <View style={styles.debugInfo}>
              <Text style={styles.debugText}>
                DB: {dbgCount.total}张, 已索引: {dbgCount.indexed}, 有向量: {dbgCount.hasEmbed}
              </Text>
              <Text style={styles.debugText}>
                AI模型: {AIService.getInstance().getModelType() || '未知'} | 
                已初始化: {AIService.getInstance().isInitialized() ? '是' : '否'}
              </Text>
            </View>
          )}
        </View>
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
  debugInfo: {
    padding: 16,
    backgroundColor: '#FFF3CD',
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  debugText: {
    fontSize: 12,
    color: '#856404',
    marginBottom: 4,
  },
});
