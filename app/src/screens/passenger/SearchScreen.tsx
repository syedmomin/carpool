import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, TextInput, StyleSheet, Pressable, FlatList, Modal,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CURVE, RideCard, EmptyState, Chip, AppBar, RideCardSkeleton, RouteTag, DatePickerInput, TimePickerInput } from '../../components';
import CitySearchModal from '../../components/CitySearchModal';
import { useApp } from '../../context/AppContext';
import { ridesApi, scheduleAlertsApi } from '../../services/api';
import { parseApiError } from '../../utils/errorMessages';
import { socketService } from '../../services/socket.service';
import { useToast } from '../../context/ToastContext';
import { useSocketData } from '../../context/SocketDataContext';
import { searchHistory, SearchEntry } from '../../utils/searchHistory';
import { getNiceDate } from '../../utils/date';

const SORT_OPTIONS = ['Price: Low to High', 'Price: High to Low', 'Earliest Departure', 'Highest Rated'];

// Popular car brands available in Pakistan (Pakistani / Japanese / Korean / Chinese)
const VEHICLE_BRANDS = [
  // Japanese
  'Toyota', 'Suzuki', 'Honda', 'Daihatsu', 'Mitsubishi', 'Nissan', 'Mazda', 'Subaru',
  // Korean
  'Hyundai', 'Kia',
  // Chinese
  'Changan', 'MG', 'Proton', 'FAW', 'DFSK', 'Haval', 'Chery', 'BYD', 'JAC', 'Jinbei', 'Joylong', 'Foton',
  // Heavy / Commercial / Bus
  'Hino', 'Daewoo', 'Isuzu', 'Master', 'Yutong', 'King Long', 'Ankai', 'Zhongtong',
  // European / American (present in Pakistan)
  'Mercedes', 'BMW', 'Audi', 'Land Rover',
  // Other
  'Other',
];

const TIME_SLOTS = [
  { label: 'Morning', icon: 'sunny-outline', from: '05:00', to: '12:00' },
  { label: 'Afternoon', icon: 'partly-sunny-outline', from: '12:00', to: '17:00' },
  { label: 'Evening', icon: 'moon-outline', from: '17:00', to: '21:00' },
  { label: 'Night', icon: 'cloudy-night-outline', from: '21:00', to: '23:59' },
];

// ─── Brand Filter Modal ────────────────────────────────────────────────────────
function BrandModal({ visible, selected, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sortOverlay} onPress={onClose}>
        <View style={[styles.sortSheet, { maxHeight: '75%' }]}>
          <View style={styles.sheetHandleRow}>
            <Text style={styles.sortTitle}>Filter by Brand</Text>
            {selected ? (
              <Pressable onPress={() => onSelect('')}>
                <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 14 }}>Clear</Text>
              </Pressable>
            ) : null}
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.brandGrid}>
              {VEHICLE_BRANDS.map(brand => (
                <Pressable
                  key={brand}
                  style={[styles.brandChip, selected === brand && styles.brandChipActive]}
                  onPress={() => onSelect(selected === brand ? '' : brand)}
                >
                  <Text style={[styles.brandChipText, selected === brand && { color: '#fff' }]}>
                    {brand}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
          <Pressable style={styles.sheetCloseBtn} onPress={onClose}>
            <Text style={styles.sheetCloseBtnText}>Done</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Time Filter Modal ────────────────────────────────────────────────────────
function TimeModal({ visible, selected, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sortOverlay} onPress={onClose}>
        <View style={styles.sortSheet}>
          <View style={styles.sheetHandleRow}>
            <Text style={styles.sortTitle}>Departure Time</Text>
            {selected !== null ? (
              <Pressable onPress={() => onSelect(null)}>
                <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 14 }}>Clear</Text>
              </Pressable>
            ) : null}
          </View>
          {TIME_SLOTS.map((slot, i) => (
            <Pressable
              key={i}
              style={[styles.sortOption, selected === i && styles.sortOptionActive]}
              onPress={() => { onSelect(selected === i ? null : i); onClose(); }}
            >
              <View style={styles.timeSlotRow}>
                <Ionicons name={(slot.icon) as any} size={18} color={selected === i ? COLORS.primary : COLORS.gray} />
                <View>
                  <Text style={[styles.sortOptionText, selected === i && { color: COLORS.primary, fontWeight: '700' }]}>
                    {slot.label}
                  </Text>
                  <Text style={styles.timeSlotSub}>{slot.from} – {slot.to}</Text>
                </View>
              </View>
              {selected === i && <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />}
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Max Price Modal ──────────────────────────────────────────────────────────
function MaxPriceModal({ visible, value, onApply, onClose }) {
  const [input, setInput] = useState(value);
  useEffect(() => { if (visible) setInput(value); }, [visible]);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sortOverlay} onPress={onClose}>
        <View style={styles.sortSheet}>
          <View style={styles.sheetHandleRow}>
            <Text style={styles.sortTitle}>Max Price (Rs)</Text>
            {value ? (
              <Pressable onPress={() => { onApply(''); onClose(); }}>
                <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 14 }}>Clear</Text>
              </Pressable>
            ) : null}
          </View>
          <TextInput
            style={styles.priceInput}
            placeholder="e.g. 500"
            placeholderTextColor={COLORS.gray}
            value={input}
            onChangeText={v => setInput(v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            autoFocus
            maxLength={6}
          />
          <Pressable
            style={styles.sheetCloseBtn}
            onPress={() => { onApply(input); onClose(); }}
          >
            <Text style={styles.sheetCloseBtnText}>Apply</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeInSlot(departureTime, slot) {
  if (!departureTime || !slot) return true;
  const [h, m] = departureTime.split(':').map(Number);
  const mins = h * 60 + m;
  const [fh, fm] = slot.from.split(':').map(Number);
  const [th, tm] = slot.to.split(':').map(Number);
  return mins >= fh * 60 + fm && mins <= th * 60 + tm;
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function SearchScreen({ navigation, route }) {
  const { searchRides } = useApp();
  const { showToast } = useToast();
  const { availableRides, availableRidesState, loadAvailableRides } = useSocketData() as any;
  const [from, setFrom] = useState(route.params?.from || '');
  const [to, setTo] = useState(route.params?.to || '');
  const [date, setDate] = useState(route.params?.date || '');
  const [departTime, setDepartTime] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [sort, setSort] = useState(null);
  const [showSortModal, setShowSortModal] = useState(false);
  const [filterAC, setFilterAC] = useState(false);
  const [filterBrand, setFilterBrand] = useState('');
  const [filterTime, setFilterTime] = useState(null);
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showMaxPriceModal, setShowMaxPriceModal] = useState(false);
  const [cityModal, setCityModal] = useState(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showDepartTimeModal, setShowDepartTimeModal] = useState(false);
  const [recentSearches, setRecentSearches] = useState<SearchEntry[]>([]);
  const [alertState, setAlertState] = useState<'idle' | 'saving' | 'saved'>('idle');

  const activeFilterCount = [filterAC, filterBrand, filterTime !== null, !!filterMaxPrice].filter(Boolean).length;

  // ── Compute display list ──────────────────────────────────────────────────
  const displayList = useMemo(() => {
    const base = searchResults !== null
      ? searchResults
      : (availableRides || []).filter(r => r.status === 'ACTIVE');

    let list = base.filter(r => (r.totalSeats - r.bookedSeats) >= passengers);
    if (filterAC) list = list.filter(r => r.vehicle?.ac);
    if (filterBrand) list = list.filter(r => r.vehicle?.brand?.toLowerCase() === filterBrand.toLowerCase());
    if (filterTime !== null) {
      const slot = TIME_SLOTS[filterTime];
      list = list.filter(r => timeInSlot(r.departureTime, slot));
    }
    if (filterMaxPrice) {
      const max = Number(filterMaxPrice);
      if (!isNaN(max) && max > 0) list = list.filter(r => (r.segmentPrice ?? r.pricePerSeat) <= max);
    }

    if (sort === 0) list.sort((a, b) => (a.segmentPrice ?? a.pricePerSeat) - (b.segmentPrice ?? b.pricePerSeat));
    if (sort === 1) list.sort((a, b) => (b.segmentPrice ?? b.pricePerSeat) - (a.segmentPrice ?? a.pricePerSeat));
    if (sort === 2) list.sort((a, b) => (a.departureTime || '').localeCompare(b.departureTime || ''));
    if (sort === 3) list.sort((a, b) => (b.driver?.rating || 0) - (a.driver?.rating || 0));

    return list;
  }, [searchResults, availableRides, passengers, filterAC, filterBrand, filterTime, filterMaxPrice, sort]);

  useEffect(() => {
    if (searchResults !== null && availableRides.length > 0) {
      console.log('[SearchScreen] Global Ride Feed Update. Current Results:', searchResults.length, 'Available:', availableRides.length);

      let changed = false;
      const updatedResults = searchResults.map((sr: any) => {
        const matchingGlobal = availableRides.find(r => r.id === sr.id);
        if (matchingGlobal && JSON.stringify(matchingGlobal) !== JSON.stringify(sr)) {
          changed = true;
          return { ...sr, ...matchingGlobal };
        }
        return sr;
      });

      // Find truly NEW rides that match filters
      const newMatches = availableRides.filter(r => {
        if (r.status !== 'ACTIVE') return false;
        const isNotPresent = !searchResults.find((sr: any) => sr.id === r.id);
        const matchesFrom  = !from || r.fromCity?.toLowerCase().includes(from.toLowerCase()) || r.from?.toLowerCase().includes(from.toLowerCase());
        const matchesTo    = !to   || r.toCity?.toLowerCase().includes(to.toLowerCase()) || r.to?.toLowerCase().includes(to.toLowerCase());
        return isNotPresent && matchesFrom && matchesTo;
      });

      if (newMatches.length > 0) {
        setSearchResults(prev => [...(newMatches as any), ...(prev || [])]);
        showToast(`Found ${newMatches.length} new ride(s) matching your search`, 'info');
      } else if (changed) {
        setSearchResults(updatedResults);
      }
    }
  }, [availableRides, from, to, showToast]);

  const bestValueId = useMemo(() => {
    if (!displayList || displayList.length < 2) return null;
    let min = Infinity;
    let minId = null;
    displayList.forEach(r => {
      const p = r.segmentPrice ?? r.pricePerSeat;
      if (p < min) { min = p; minId = r.id; }
    });
    return minId;
  }, [displayList]);

  const doSearch = useCallback(async (forcedFrom?: string, forcedTo?: string) => {
    const sFrom = forcedFrom !== undefined ? forcedFrom : from;
    const sTo = forcedTo !== undefined ? forcedTo : to;

    if (!sFrom && !sTo) { setSearchResults(null); return; }
    setLoading(true);
    const { data, error } = await searchRides(sFrom, sTo, date);
    setLoading(false);
    setSearchError(!!error);
    setSearchResults(error || !data ? [] : data);

    if (sFrom && sTo && !error && data && data.length > 0) {
      searchHistory.save(sFrom, sTo).then(setRecentSearches);
    }
  }, [from, to, date, searchRides]);

  const handleRecentPress = (entry: SearchEntry) => {
    setFrom(entry.from);
    setTo(entry.to);
    doSearch(entry.from, entry.to);
  };

  useFocusEffect(useCallback(() => {
    searchHistory.get().then(setRecentSearches);
    loadAvailableRides(1, 40);
  }, [loadAvailableRides]));

  useEffect(() => {
    if (route.params?.from || route.params?.to) doSearch();
  }, [doSearch]);

  useEffect(() => { setAlertState('idle'); }, [from, to, date]);

  const handleSetAlert = async () => {
    if (!from || !to || !date) return;
    setAlertState('saving');
    const { error } = await scheduleAlertsApi.create({ fromCity: from, toCity: to, date });
    if (error) {
      setAlertState('idle');
      showToast(parseApiError(error), 'error');
      return;
    }
    setAlertState('saved');
    showToast("We'll notify you when a matching ride is posted", 'success');
  };

  const swapCities = () => { setFrom(to); setTo(from); };

  const activeFilters = [
    filterAC && 'AC',
    filterBrand && filterBrand,
    filterTime !== null && TIME_SLOTS[filterTime].label,
    filterMaxPrice && `Max Rs ${filterMaxPrice}`,
  ].filter(Boolean);

  const fromCity = from || '';
  const toCity = to || '';

  return (
    <View style={styles.container}>
      {/* ── App Bar ──────────────────────────────────────────────────── */}
      <AppBar title="Search Rides" />

      {/* ── Search Form ──────────────────────────────────────────────── */}
      <View style={styles.searchContainer}>
        <View style={styles.searchCard}>
          {/* From / To — matches the Home screen's route card */}
          <View style={styles.routeCard}>
            <View style={styles.routeLeft}>
              <View style={[styles.routeDot, { backgroundColor: COLORS.primary }]} />
              <View style={styles.routeVertLine} />
              <View style={[styles.routeDot, { backgroundColor: COLORS.danger }]} />
            </View>
            <View style={styles.routeInputs}>
              <Pressable style={styles.routeInputTouch} onPress={() => setCityModal('from')}>
                <Text style={[styles.routeInput, !from && styles.routeInputPlaceholder]} numberOfLines={1}>
                  {from || 'Leaving From'}
                </Text>
              </Pressable>
              <View style={styles.routeInputDivider} />
              <Pressable style={styles.routeInputTouch} onPress={() => setCityModal('to')}>
                <Text style={[styles.routeInput, !to && styles.routeInputPlaceholder]} numberOfLines={1}>
                  {to || 'Where to?'}
                </Text>
              </Pressable>
            </View>
            <Pressable onPress={swapCities} style={styles.swapBtn}>
              <Ionicons name="swap-vertical" size={18} color={COLORS.primary} />
            </Pressable>
          </View>

          {/* Search Button */}
          <Pressable style={styles.searchBtn} onPress={() => doSearch()} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="search" size={18} color="#fff" />
                <Text style={styles.searchBtnText}>Search Rides</Text>
              </>
            )}
          </Pressable>

          {/* Quick Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersScroll}
            contentContainerStyle={styles.filtersScrollContent}
          >
            <Chip
              label={date ? getNiceDate(date) : 'Any Date'}
              icon="calendar-outline"
              active={!!date}
              onPress={() => setShowDateModal(true)}
              style={styles.filterChip}
            />
            <Chip
              label={departTime || 'Any Time'}
              icon="time-outline"
              active={!!departTime}
              onPress={() => setShowDepartTimeModal(true)}
              style={styles.filterChip}
            />
            <Chip label="AC" icon="snow-outline" active={filterAC} onPress={() => setFilterAC(!filterAC)} style={styles.filterChip} />
            <Chip
              label={filterBrand || 'Brand'}
              icon="business-outline"
              active={!!filterBrand}
              onPress={() => setShowBrandModal(true)}
              style={styles.filterChip}
            />

            <Chip
              label={filterTime !== null ? TIME_SLOTS[filterTime].label : 'Time'}
              icon="time-outline"
              active={filterTime !== null}
              onPress={() => setShowTimeModal(true)}
              style={styles.filterChip}
            />

            <Chip
              label={filterMaxPrice ? `Max Rs ${filterMaxPrice}` : 'Max Price'}
              icon="pricetag-outline"
              active={!!filterMaxPrice}
              onPress={() => setShowMaxPriceModal(true)}
              style={styles.filterChip}
            />

            <Chip label="Sort" icon="funnel-outline" active={sort !== null} onPress={() => setShowSortModal(true)} style={styles.filterChip} />
          </ScrollView>
        </View>

        {/* Recent Searches */}
        {recentSearches.length > 0 && searchResults === null && !loading && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>Recent Searches</Text>
              <Pressable onPress={() => searchHistory.clear().then(() => setRecentSearches([]))}>
                <Text style={styles.clearHistory}>Clear</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
              {recentSearches.map((h, i) => (
                <Pressable key={i} style={styles.recentCard} onPress={() => handleRecentPress(h)}>
                  <Ionicons name="time-outline" size={14} color={COLORS.gray} />
                  <RouteTag from={h.from} to={h.to} textStyle={styles.recentText} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Active filter pills */}
      {activeFilters.length > 0 && (
        <View style={styles.activeFiltersRow}>
          {activeFilters.map((f, i) => (
            <View key={i} style={styles.activePill}>
              <Text style={styles.activePillText}>{f}</Text>
            </View>
          ))}
          <Pressable
            style={styles.clearAllBtn}
            onPress={() => { setFilterAC(false); setFilterBrand(''); setFilterTime(null); setFilterMaxPrice(''); setSort(null); }}
          >
            <Text style={styles.clearAllText}>Clear all</Text>
          </Pressable>
        </View>
      )}

      {/* ── Results header ───────────────────────────────────────────── */}
      {!loading && (
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {displayList.length} ride{displayList.length !== 1 ? 's' : ''} found
          </Text>
          {fromCity && toCity ? (
            <RouteTag from={fromCity} to={toCity} textStyle={styles.resultsRoute} arrowColor={COLORS.gray} />
          ) : (
            sort !== null && <Text style={styles.sortLabel}>{SORT_OPTIONS[sort]}</Text>
          )}
        </View>
      )}

      <FlatList
        data={displayList}
        keyExtractor={item => item.id + (item.boardingCity || '')}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <RideCard
            ride={item}
            driver={item.driver}
            vehicle={item.vehicle}
            index={index}
            boardingCity={item.boardingCity}
            exitCity={item.exitCity}
            segmentPrice={item.segmentPrice}
            isBestValue={item.id === bestValueId}
            onPress={() => navigation.navigate('RideDetail', {
              rideId: item.id,
              rideData: item,
              boardingCity: item.boardingCity,
              exitCity: item.exitCity,
            })}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <View style={{ paddingTop: 10 }}>
              {[1, 2, 3].map(i => <RideCardSkeleton key={i} />)}
            </View>
          ) : searchError ? (
            <EmptyState
              icon="car-outline"
              title="Couldn't load rides"
              subtitle="Please check your connection and try again."
              action={{ label: 'Try Again', onPress: () => doSearch() }}
            />
          ) : (
            <View style={styles.emptyStateWrapper}>
              <EmptyState title="No rides found" subtitle="Try different dates or cities" style={{ paddingVertical: 0 }} />
              {from && to && date ? (
                <Pressable
                  style={[styles.notifyBtn, alertState === 'saved' && styles.notifyBtnSaved]}
                  onPress={handleSetAlert}
                  disabled={alertState !== 'idle'}
                >
                  {alertState === 'saving' ? (
                    <ActivityIndicator color={COLORS.primary} size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name={alertState === 'saved' ? 'checkmark-circle' : 'notifications-outline'}
                        size={16}
                        color={COLORS.primary}
                      />
                      <Text style={styles.notifyBtnText}>
                        {alertState === 'saved' ? "We'll notify you" : 'Notify me when a ride is posted'}
                      </Text>
                    </>
                  )}
                </Pressable>
              ) : null}
            </View>
          )
        }
      />

      {/* Modals */}
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

      {/* Departure Date Modal */}
      <Modal visible={showDateModal} transparent animationType="slide" onRequestClose={() => setShowDateModal(false)}>
        <Pressable style={styles.sortOverlay} onPress={() => setShowDateModal(false)}>
          <View style={styles.sortSheet}>
            <View style={styles.sheetHandleRow}>
              <Text style={styles.sortTitle}>Departure Date</Text>
              {date ? (
                <Pressable onPress={() => setDate('')}>
                  <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 14 }}>Clear</Text>
                </Pressable>
              ) : null}
            </View>
            <DatePickerInput value={date || null} onChange={v => { setDate(v); setShowDateModal(false); }} minDate={new Date()} placeholder="Any date" />
          </View>
        </Pressable>
      </Modal>

      {/* Departure Time Modal */}
      <Modal visible={showDepartTimeModal} transparent animationType="slide" onRequestClose={() => setShowDepartTimeModal(false)}>
        <Pressable style={styles.sortOverlay} onPress={() => setShowDepartTimeModal(false)}>
          <View style={styles.sortSheet}>
            <View style={styles.sheetHandleRow}>
              <Text style={styles.sortTitle}>Departure Time</Text>
              {departTime ? (
                <Pressable onPress={() => setDepartTime('')}>
                  <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 14 }}>Clear</Text>
                </Pressable>
              ) : null}
            </View>
            <TimePickerInput value={departTime || null} onChange={v => { setDepartTime(v); setShowDepartTimeModal(false); }} placeholder="Any time" />
          </View>
        </Pressable>
      </Modal>

      <BrandModal
        visible={showBrandModal}
        selected={filterBrand}
        onSelect={(b) => { setFilterBrand(b); }}
        onClose={() => setShowBrandModal(false)}
      />

      <TimeModal
        visible={showTimeModal}
        selected={filterTime}
        onSelect={setFilterTime}
        onClose={() => setShowTimeModal(false)}
      />

      {/* Max Price Modal */}
      <MaxPriceModal
        visible={showMaxPriceModal}
        value={filterMaxPrice}
        onApply={setFilterMaxPrice}
        onClose={() => setShowMaxPriceModal(false)}
      />

      {/* Sort Modal */}
      <Modal visible={showSortModal} transparent animationType="slide" onRequestClose={() => setShowSortModal(false)}>
        <Pressable style={styles.sortOverlay} onPress={() => setShowSortModal(false)}>
          <View style={styles.sortSheet}>
            <Text style={styles.sortTitle}>Sort By</Text>
            <Pressable
              style={[styles.sortOption, sort === null && styles.sortOptionActive]}
              onPress={() => { setSort(null); setShowSortModal(false); }}
            >
              <Text style={[styles.sortOptionText, sort === null && { color: COLORS.primary, fontWeight: '700' }]}>Default (No Sort)</Text>
              {sort === null && <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />}
            </Pressable>
            {SORT_OPTIONS.map((opt, i) => (
              <Pressable
                key={i}
                style={[styles.sortOption, sort === i && styles.sortOptionActive]}
                onPress={() => { setSort(i); setShowSortModal(false); }}
              >
                <Text style={[styles.sortOptionText, sort === i && { color: COLORS.primary, fontWeight: '700' }]}>{opt}</Text>
                {sort === i && <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  searchContainer: { marginTop: 0, paddingHorizontal: 16 },
  searchCard: {
    backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: 'rgba(15, 23, 42, 0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 16, elevation: 2,
    ...CURVE,
  },
  // Route card (matches HomeScreen)
  routeCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16, padding: 14, marginBottom: 12, gap: 12,
    borderWidth: 1, borderColor: COLORS.border,
    ...CURVE,
  },
  routeLeft: { alignItems: 'center', gap: 3 },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeVertLine: { width: 2, height: 22, backgroundColor: COLORS.border },
  routeInputs: { flex: 1 },
  routeInputTouch: { paddingVertical: 6 },
  routeInput: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  routeInputPlaceholder: { color: COLORS.gray, fontWeight: '400' },
  routeInputDivider: { height: 1, borderTopWidth: 1, borderTopColor: COLORS.border },
  swapBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
    ...CURVE,
  },
  searchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 12, marginBottom: 16 },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  filtersScroll: { flexDirection: 'row' },
  filtersScrollContent: { paddingHorizontal: 0, paddingBottom: 12 },
  filterChip: {
    marginRight: 8,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontWeight: '700',
    ...CURVE,
  },
  activeFiltersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, paddingHorizontal: 16 },
  activePill: { backgroundColor: COLORS.primary + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  activePillText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  clearAllBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  clearAllText: { fontSize: 12, color: COLORS.danger, fontWeight: '600' },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  resultsCount: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  resultsRoute: { fontSize: 12, color: COLORS.gray },
  sortLabel: { fontSize: 12, color: COLORS.gray },
  listContent: { paddingHorizontal: 20, paddingBottom: 24 },
  sortOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sortSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  sheetHandleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sortTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...CURVE,
  },
  sortOptionActive: { backgroundColor: COLORS.primary + '10', borderRadius: 12 },
  sortOptionText: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  timeSlotRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timeSlotSub: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  sheetCloseBtn: { marginTop: 16, alignItems: 'center', paddingVertical: 13, borderRadius: 14, backgroundColor: COLORS.primary },
  sheetCloseBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  priceInput: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 14, fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16, textAlign: 'center' },
  brandGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 8 },
  brandChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.lightGray },
  brandChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  brandChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  recentSection: { marginTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 16 },
  recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  recentTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  clearHistory: { fontSize: 12, color: COLORS.danger, fontWeight: '600' },
  recentCard: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginRight: 10 },
  recentText: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary },
  loadingContainer: {
    paddingTop: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
  },
  emptyStateWrapper: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  notifyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 8, paddingHorizontal: 18, paddingVertical: 12,
    borderRadius: 24, borderWidth: 1.5, borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  notifyBtnSaved: { borderColor: COLORS.secondary, backgroundColor: '#e8f5e9' },
  notifyBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
});
