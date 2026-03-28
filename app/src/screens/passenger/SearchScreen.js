import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Modal,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RideCard, EmptyState, Chip, SearchInput } from '../../components';
import { useApp } from '../../context/AppContext';
import { searchPakistanLocations } from '../../utils/locationSearch';

const SORT_OPTIONS = ['Price: Low to High', 'Price: High to Low', 'Earliest Departure', 'Highest Rated'];

// ─── City Search Modal ────────────────────────────────────────────────────────
function CitySearchModal({ visible, title, onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!visible) { setQuery(''); setResults([]); }
  }, [visible]);

  const handleSearch = (text) => {
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
      <View style={ms.container}>
        <View style={ms.header}>
          <Text style={ms.title}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={ms.searchWrap}>
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
              <TouchableOpacity style={ms.item} onPress={() => onSelect(item.name)}>
                <Ionicons name="location-outline" size={18} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={ms.itemName}>{item.name}</Text>
                  <Text style={ms.itemSub} numberOfLines={1}>{item.displayName}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        ) : query.length >= 2 && !searching ? (
          <View style={ms.empty}>
            <Ionicons name="search-outline" size={40} color={COLORS.border} />
            <Text style={ms.emptyText}>No results. Try a different name.</Text>
          </View>
        ) : (
          <View style={ms.hint}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.gray} />
            <Text style={ms.hintText}>Type at least 2 characters to search</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

export default function SearchScreen({ navigation, route }) {
  const { searchRides, getDriverById, getVehicleById } = useApp();
  const [from, setFrom] = useState(route.params?.from || '');
  const [to,   setTo]   = useState(route.params?.to   || '');
  const [date, setDate] = useState(route.params?.date || '');
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [searched, setSearched] = useState(false);
  const [sort,     setSort]     = useState(0);
  const [showSortModal, setShowSortModal] = useState(false);
  const [filterAC,      setFilterAC]      = useState(false);
  const [filterVehicle, setFilterVehicle] = useState('');
  const [cityModal, setCityModal] = useState(null); // 'from' | 'to'

  const doSearch = useCallback(async () => {
    if (!from && !to) return;
    setLoading(true);
    setSearched(true);
    const { data, error } = await searchRides(from, to, date);
    setLoading(false);
    if (error || !data) { setResults([]); return; }
    let filtered = [...data];
    if (filterAC) filtered = filtered.filter(r => r.amenities?.includes('AC'));
    if (filterVehicle) filtered = filtered.filter(r => {
      const v = getVehicleById(r.vehicleId);
      return v?.type === filterVehicle;
    });
    switch (sort) {
      case 0: filtered.sort((a, b) => (a.segmentPrice ?? a.pricePerSeat) - (b.segmentPrice ?? b.pricePerSeat)); break;
      case 1: filtered.sort((a, b) => (b.segmentPrice ?? b.pricePerSeat) - (a.segmentPrice ?? a.pricePerSeat)); break;
      case 2: filtered.sort((a, b) => (a.departureTime || '').localeCompare(b.departureTime || '')); break;
      case 3: filtered.sort((a, b) => (getDriverById(b.driverId)?.rating || 0) - (getDriverById(a.driverId)?.rating || 0)); break;
    }
    setResults(filtered);
  }, [from, to, date, sort, filterAC, filterVehicle]);

  // Auto search when params come from HomeScreen
  useEffect(() => {
    if (route.params?.from || route.params?.to) doSearch();
  }, []);

  const swapCities = () => { setFrom(to); setTo(from); };

  return (
    <View style={styles.container}>
      {/* ── Search Header ──────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find a Ride</Text>
      </View>

      {/* ── Search Form ────────────────────────────────────────────────── */}
      <View style={styles.searchForm}>
        <View style={styles.searchRow}>
          <TouchableOpacity style={styles.cityInput} onPress={() => setCityModal('from')}>
            <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
            <Text style={[styles.cityInputText, !from && styles.placeholder]}>{from || 'Leaving from?'}</Text>
            {from ? (
              <TouchableOpacity onPress={() => setFrom('')}>
                <Ionicons name="close-circle" size={16} color={COLORS.gray} />
              </TouchableOpacity>
            ) : (
              <Ionicons name="chevron-down" size={16} color={COLORS.gray} />
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={swapCities} style={styles.swapBtn}>
            <Ionicons name="swap-vertical" size={18} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.cityInput} onPress={() => setCityModal('to')}>
            <View style={[styles.dot, { backgroundColor: COLORS.secondary }]} />
            <Text style={[styles.cityInputText, !to && styles.placeholder]}>{to || 'Going to?'}</Text>
            {to ? (
              <TouchableOpacity onPress={() => setTo('')}>
                <Ionicons name="close-circle" size={16} color={COLORS.gray} />
              </TouchableOpacity>
            ) : (
              <Ionicons name="chevron-down" size={16} color={COLORS.gray} />
            )}
          </TouchableOpacity>
        </View>

        {/* Search Button */}
        <TouchableOpacity style={styles.searchBtn} onPress={doSearch} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <><Ionicons name="search" size={18} color="#fff" /><Text style={styles.searchBtnText}>Search Rides</Text></>
          }
        </TouchableOpacity>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          <Chip label="AC" icon="snow-outline" active={filterAC} onPress={() => setFilterAC(!filterAC)} style={styles.filterChip} />
          {['Car', 'Hiace', 'Coaster', 'Bus'].map(v => (
            <Chip key={v} label={v} icon="car-outline" active={filterVehicle === v} onPress={() => setFilterVehicle(filterVehicle === v ? '' : v)} style={styles.filterChip} />
          ))}
          <Chip label="Sort" icon="funnel-outline" active={false} onPress={() => setShowSortModal(true)} style={styles.filterChip} />
        </ScrollView>
      </View>

      {/* ── Results ────────────────────────────────────────────────────── */}
      {searched && !loading && (
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {results.length} ride{results.length !== 1 ? 's' : ''} found
            {from && to ? ` (${from} → ${to})` : from ? ` from ${from}` : to ? ` to ${to}` : ''}
          </Text>
          <Text style={styles.sortLabel}>{SORT_OPTIONS[sort]}</Text>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={item => item.id + (item.boardingCity || '')}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <RideCard
            ride={item}
            driver={getDriverById(item.driverId)}
            vehicle={getVehicleById(item.vehicleId)}
            boardingCity={item.boardingCity}
            exitCity={item.exitCity}
            segmentPrice={item.segmentPrice}
            onPress={() => navigation.navigate('RideDetail', {
              rideId: item.id,
              boardingCity: item.boardingCity,
              exitCity: item.exitCity,
            })}
          />
        )}
        ListEmptyComponent={
          searched && !loading ? (
            <EmptyState
              icon="car-outline"
              title="No Rides Found"
              subtitle={from || to
                ? `No rides available on this route. Try different cities or check back later.`
                : 'Search for rides by entering departure and destination cities.'}
            />
          ) : !searched ? (
            <View style={styles.promptWrap}>
              <Ionicons name="map-outline" size={64} color={COLORS.border} />
              <Text style={styles.promptTitle}>Search for rides</Text>
              <Text style={styles.promptSub}>Enter departure and destination to find available rides</Text>
            </View>
          ) : null
        }
      />

      {/* ── City Search Modal ──────────────────────────────────────────── */}
      <CitySearchModal
        visible={!!cityModal}
        title={cityModal === 'from' ? 'Leaving From' : 'Going To'}
        onSelect={(city) => {
          if (cityModal === 'from') setFrom(city);
          else setTo(city);
          setCityModal(null);
        }}
        onClose={() => setCityModal(null)}
      />

      {/* ── Sort Modal ─────────────────────────────────────────────────── */}
      <Modal visible={showSortModal} transparent animationType="slide" onRequestClose={() => setShowSortModal(false)}>
        <TouchableOpacity style={styles.sortOverlay} onPress={() => setShowSortModal(false)} activeOpacity={1}>
          <View style={styles.sortSheet}>
            <Text style={styles.sortTitle}>Sort By</Text>
            {SORT_OPTIONS.map((opt, i) => (
              <TouchableOpacity key={i} style={styles.sortOption} onPress={() => { setSort(i); setShowSortModal(false); }}>
                <Text style={[styles.sortOptionText, sort === i && { color: COLORS.primary, fontWeight: '700' }]}>{opt}</Text>
                {sort === i && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const ms = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#fff' },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 55, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title:      { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  searchWrap: { padding: 16, paddingBottom: 8 },
  item:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 12 },
  itemName:   { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  itemSub:    { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  empty:      { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText:  { fontSize: 14, color: COLORS.gray },
  hint:       { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 20, paddingTop: 24 },
  hintText:   { fontSize: 13, color: COLORS.gray },
});

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.bg },
  header:         { flexDirection: 'row', alignItems: 'center', paddingTop: 55, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn:        { marginRight: 16 },
  headerTitle:    { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  searchForm:     { backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 12 },
  searchRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 8 },
  cityInput:      { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, gap: 8 },
  dot:            { width: 8, height: 8, borderRadius: 4 },
  cityInputText:  { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  placeholder:    { color: COLORS.gray, fontWeight: '400' },
  swapBtn:        { paddingHorizontal: 8 },
  searchBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 12, marginBottom: 10 },
  searchBtnText:  { color: '#fff', fontWeight: '700', fontSize: 14 },
  filtersScroll:  { flexDirection: 'row' },
  filterChip:     { marginRight: 8 },
  resultsHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  resultsCount:   { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  sortLabel:      { fontSize: 12, color: COLORS.gray },
  listContent:    { paddingHorizontal: 20, paddingBottom: 24 },
  promptWrap:     { alignItems: 'center', paddingTop: 60, gap: 12, paddingHorizontal: 40 },
  promptTitle:    { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  promptSub:      { fontSize: 13, color: COLORS.gray, textAlign: 'center', lineHeight: 20 },
  sortOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sortSheet:      { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  sortTitle:      { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16 },
  sortOption:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sortOptionText: { fontSize: 15, color: COLORS.textPrimary },
});
