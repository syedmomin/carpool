import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, StyleSheet, Pressable,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, FONTS } from './theme';
import { SearchInput } from './Input';
import { searchCities, POPULAR_CITIES } from '../constants/cities';

import { haptics } from '../utils/haptics';

interface Props {
  visible: boolean;
  title: string;
  onSelect: (name: string) => void;
  onClose: () => void;
}

export default function CitySearchModal({ visible, title, onSelect, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>(POPULAR_CITIES);

  useEffect(() => {
    if (!visible) { setQuery(''); setResults(POPULAR_CITIES); }
  }, [visible]);

  const handleSearch = (text: string) => {
    setQuery(text);
    setResults(searchCities(text));
  };

  const handleSelect = (city: string) => {
    haptics.selection();
    onSelect(city);
    onClose();
  };

  const isPopular = !query.trim();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={GRADIENTS.primary as any}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 15 }]}
        >
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
            <Ionicons name="close" size={20} color="#fff" />
          </Pressable>
        </LinearGradient>

        {/* Search */}
        <View style={styles.searchWrap}>
          <SearchInput
            placeholder="Search city..."
            value={query}
            onChangeText={handleSearch}
            onClear={() => handleSearch('')}
          />
        </View>

        {/* Section label */}
        <View style={styles.sectionRow}>
          <Ionicons
            name={isPopular ? 'star' : 'search-outline'}
            size={12}
            color={COLORS.primary}
          />
          <Text style={styles.sectionLabel}>
            {isPopular ? 'Popular Cities' : `${results.length} result${results.length !== 1 ? 's' : ''}`}
          </Text>
        </View>

        {results.length > 0 ? (
          <FlatList
            data={results}
            keyExtractor={item => item}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable style={({ pressed }) => [styles.item, pressed && styles.itemPressed]} onPress={() => handleSelect(item)}>
                <View style={styles.iconBox}>
                  <Ionicons name="location" size={16} color={COLORS.primary} />
                </View>
                <Text style={styles.itemName}>{item}</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.border} />
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={{ paddingBottom: 40, paddingTop: 4 }}
          />
        ) : (
          <View style={styles.empty}>
            <View style={styles.emptyIconBox}>
              <Ionicons name="location-outline" size={36} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>City not found</Text>
            <Text style={styles.emptyText}>Check spelling or try a nearby major city</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#fff' },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 18 },
  title:        { fontSize: 18, fontFamily: FONTS.extraBold, color: '#fff' },
  closeBtn:     { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  searchWrap:   { padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sectionRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12 },
  sectionLabel: { fontSize: 12, color: COLORS.textPrimary, fontFamily: FONTS.bold, textTransform: 'uppercase', letterSpacing: 0.5 },
  item:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 20, gap: 12 },
  itemPressed:  { backgroundColor: COLORS.primaryLight },
  iconBox:      { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  itemName:     { flex: 1, fontSize: 15, fontFamily: FONTS.semiBold, color: COLORS.textPrimary },
  separator:    { height: 1, backgroundColor: COLORS.border, marginLeft: 66 },
  empty:        { alignItems: 'center', paddingTop: 80, gap: 10, paddingHorizontal: 40 },
  emptyIconBox: { width: 76, height: 76, borderRadius: 38, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle:   { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.textPrimary },
  emptyText:    { fontSize: 13, color: COLORS.gray, textAlign: 'center', lineHeight: 20, fontFamily: FONTS.medium },
});
