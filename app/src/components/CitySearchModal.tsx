import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  FlatList, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from './theme';
import { SearchInput } from './Input';
import { searchCities, POPULAR_CITIES } from '../constants/cities';

interface Props {
  visible: boolean;
  title: string;
  onSelect: (name: string) => void;
  onClose: () => void;
}

export default function CitySearchModal({ visible, title, onSelect, onClose }: Props) {
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
    onSelect(city);
    onClose();
  };

  const isPopular = !query.trim();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

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
            name={isPopular ? 'star-outline' : 'search-outline'}
            size={13}
            color={COLORS.gray}
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
              <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
                <View style={styles.iconBox}>
                  <Ionicons name="location-outline" size={16} color={COLORS.primary} />
                </View>
                <Text style={styles.itemName}>{item}</Text>
                <Ionicons name="chevron-forward" size={14} color={COLORS.border} />
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        ) : (
          <View style={styles.empty}>
            <Ionicons name="location-outline" size={44} color={COLORS.border} />
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
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'ios' ? 55 : 45, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title:        { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  closeBtn:     { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  searchWrap:   { padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sectionRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 10 },
  sectionLabel: { fontSize: 12, color: COLORS.gray, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  item:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, gap: 12 },
  iconBox:      { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  itemName:     { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  separator:    { height: 1, backgroundColor: COLORS.border, marginLeft: 64 },
  empty:        { alignItems: 'center', paddingTop: 80, gap: 10, paddingHorizontal: 40 },
  emptyTitle:   { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  emptyText:    { fontSize: 13, color: COLORS.gray, textAlign: 'center', lineHeight: 20 },
});
