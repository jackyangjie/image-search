/**
 * @fileoverview 搜索栏组件
 */

import React, { useState, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  value?: string;
}

export function SearchBar({
  onSearch,
  placeholder = '描述你想找的照片...',
  value,
}: SearchBarProps): React.ReactElement {
  const [query, setQuery] = useState(value || '');

  const handleSubmit = useCallback(() => {
    if (query.trim()) {
      onSearch(query.trim());
    }
  }, [onSearch, query]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder={placeholder}
        placeholderTextColor="#A3A3A3"
        onSubmitEditing={handleSubmit}
        returnKeyType="search"
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <View style={styles.searchIcon} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#171717',
  },
  button: {
    padding: 8,
  },
  searchIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#A3A3A3',
    borderRadius: 12,
  },
});
