import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RideCard, EmptyState, Chip, SearchInput } from '../../components';
import { useApp } from '../../context/AppContext';
import { CITIES } from '../../data/mockData';

const SORT_OPTIONS = ['Price: Low to High', 'Price: High to Low', 'Earliest Departure', 'Highest Rated'];

export default function SearchScreen({ navigation, route }) {
  const { rides, getDriverById, getVehicleById } = useApp();
  const [from, setFrom] = useState(route.params?.from || '');
  const [to, setTo] = useState(route.params?.to || '');
  const [results, setResults] = useState([]);
  const [sort, setSort] = useState(0);
  const [showSortModal, setShowSortModal] = useState(false);
  const [filterAC, setFilterAC] = useState(false);
  const [filterVehicle, setFilterVehicle] = useState('');
  const [cityModal, setCityModal] = useState(null);
  const [citySearch, setCitySearch] = useState('');

  useEffect(() => { doSearch(); }, [from, to, sort, filterAC, filterVehicle]);

  const doSearch = () => {
    let filtered = rides.filter(r =>
      r.status === 'active' && r.bookedSeats < r.totalSeats &&
      (from ? r.from.toLowerCase().includes(from.toLowerCase()) : true) &&
      (to ? r.to.toLowerCase().includes(to.toLowerCase()) : true)
    );
    if (filterAC) filtered = filtered.filter(r => r.amenities?.includes('AC'));
    if (filterVehicle) filtered = filtered.filter(r => {
      const v = getVehicleById(r.vehicleId);
      return v?.type === filterVehicle;
    });
    switch (sort) {
      case 0: filtered.sort((a, b) => a.pricePerSeat - b.pricePerSeat); break;
      case 1: filtered.sort((a, b) => b.pricePerSeat - a.pricePerSeat); break;
      case 2: filtered.sort((a, b) => a.departureTime.localeCompare(b.departureTime)); break;
      case 3: filtered.sort((a, b) => (getDriverById(b.driverId)?.rating || 0) - (getDriverById(a.driverId)?.rating || 0)); break;
    }
    setResults(filtered);
  };

  const swapCities = () => { setFrom(to); setTo(from); };
  const filteredCities = CITIES.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()));

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride Dhundho</Text>
      </View>

      {/* Search Form */}
      <View style={styles.searchForm}>
        <View style={styles.searchRow}>
          <TouchableOpacity style={styles.cityInput} onPress={() => { setCityModal('from'); setCitySearch(''); }}>
            <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
            <Text style={[styles.cityInputText, !from && styles.placeholder]}>{from || 'Kahan se?'}</Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.gray} />
          </TouchableOpacity>
          <TouchableOpacity onPress={swapCities} style={styles.swapBtn}>
            <Ionicons name="swap-vertical" size={18} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.cityInput} onPress={() => { setCityModal('to'); setCitySearch(''); }}>
            <View style={[styles.dot, { backgroundColor: COLORS.secondary }]} />
            <Text style={[styles.cityInputText, !to && styles.placeholder]}>{to || 'Kahan tak?'}</Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
          <Chip label="AC" icon="snow-outline" active={filterAC} onPress={() => setFilterAC(!filterAC)} style={styles.filterChip} />
          {['Car', 'Hiace', 'Coaster', 'Bus'].map(v => (
            <Chip key={v} label={v} icon="car-outline" active={filterVehicle === v} onPress={() => setFilterVehicle(filterVehicle === v ? '' : v)} style={styles.filterChip} />
          ))}
          <Chip label="Sort" icon="funnel-outline" active={false} onPress={() => setShowSortModal(true)} style={styles.filterChip} />
        </ScrollView>
      </View>

      {/* Results */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>{results.length} rides mile {from && to ? `(${from} → ${to})` : ''}</Text>
        <Text style={styles.sortLabel}>{SORT_OPTIONS[sort]}</Text>
      </View>

      <FlatList
        data={results}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <RideCard
            ride={item}
            driver={getDriverById(item.driverId)}
            vehicle={getVehicleById(item.vehicleId)}
            onPress={() => navigation.navigate('RideDetail', { rideId: item.id })}
          />
        )}
        ListEmptyComponent={
          <EmptyState icon="car-outline" title="Koi Ride Nahi Mili" subtitle="Is route pe koi ride available nahi. Try different cities ya dates." />
        }
      />

      {/* City Picker Modal */}
      <Modal visible={!!cityModal} animationType="slide" onRequestClose={() => setCityModal(null)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{cityModal === 'from' ? 'Kahan Se?' : 'Kahan Tak?'}</Text>
            <TouchableOpacity onPress={() => setCityModal(null)}>
              <Ionicons name="close" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
          <SearchInput
            placeholder="City ka naam likhen..."
            value={citySearch}
            onChangeText={setCitySearch}
            onClear={() => setCitySearch('')}
            style={styles.citySearch}
          />
          <FlatList
            data={filteredCities}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.cityItem} onPress={() => { cityModal === 'from' ? setFrom(item) : setTo(item); setCityModal(null); }}>
                <Ionicons name="location-outline" size={18} color={COLORS.primary} />
                <Text style={styles.cityItemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      {/* Sort Modal */}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 55, paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { marginRight: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  searchForm: { backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 12 },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cityInput: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  cityInputText: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  placeholder: { color: COLORS.gray, fontWeight: '400' },
  swapBtn: { paddingHorizontal: 8 },
  filtersScroll: { flexDirection: 'row' },
  filterChip: { marginRight: 8 },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  resultsCount: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  sortLabel: { fontSize: 12, color: COLORS.gray },
  listContent: { paddingHorizontal: 20, paddingBottom: 24 },
  modal: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 55, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  citySearch: { margin: 16 },
  cityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 12 },
  cityItemText: { fontSize: 16, color: COLORS.textPrimary },
  sortOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sortSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  sortTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16 },
  sortOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  sortOptionText: { fontSize: 15, color: COLORS.textPrimary },
});
