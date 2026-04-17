import React, { useState, useEffect, useRef } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from './theme';
import { SearchInput } from './Input';
import { searchPakistanLocations } from '../utils/locationSearch';

interface Props {
  visible: boolean;
  title: string;
  onSelect: (name: string) => void;
  onClose: () => void;
}

export default function CitySearchModal({ visible, title, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!visible) { setQuery(''); setResults([]); }
  }, [visible]);

  const handleSearch = (text: string) => {
    setQuery(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (text.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    timerRef.current = setTimeout(async () => {
      const res = await searchPakistanLocations(text);
      setResults(res);
      setSearching(false);
    }, 400);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.searchWrap}>
          <SearchInput
            placeholder="Search city or area..."
            value={query}
            onChangeText={handleSearch}
            onClear={() => { setQuery(''); setResults([]); }}
          />
          {searching && <ActivityIndicator style={{ marginTop: 8 }} color={COLORS.primary} />}
        </View>
        {results.length > 0 ? (
          <FlatList
            data={results}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.item} onPress={() => onSelect((item as any).name)}>
                <Ionicons name="location-outline" size={18} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{(item as any).name}</Text>
                  <Text style={styles.itemSub} numberOfLines={1}>{(item as any).displayName}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        ) : query.length >= 2 && !searching ? (
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={40} color={COLORS.border} />
            <Text style={styles.emptyText}>No results. Try a different name.</Text>
          </View>
        ) : (
          <View style={styles.hint}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.gray} />
            <Text style={styles.hintText}>Type at least 2 characters to search</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#fff' },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 55, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title:      { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  searchWrap: { padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  item:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, gap: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  itemName:   { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  itemSub:    { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  empty:      { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText:  { fontSize: 14, color: COLORS.gray },
  hint:       { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 20 },
  hintText:   { fontSize: 13, color: COLORS.gray },
});
