import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, SectionList, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CURVE, EmptyState, AppBar, TabPills } from '../../components';
import { RideCardSkeleton } from '../../components/Skeleton';
import { ridesApi } from '../../services/api';

const PAGE_SIZE = 10;

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

// ─── Local status pill (Completed = green, Cancelled/Expired = red) ─────────
function historyPillStyle(status: string) {
  if (status === 'COMPLETED') return { bg: '#e8f5e9', text: COLORS.secondary };
  return { bg: COLORS.dangerLight, text: COLORS.danger };
}
function historyPillLabel(status: string) {
  if (status === 'COMPLETED') return 'Completed';
  if (status === 'EXPIRED') return 'Expired';
  return 'Cancelled';
}

// "2024-05-18" -> "May 2024"
function monthKey(dateStr: string) {
  const [y, m] = (dateStr || '').split('-').map(Number);
  if (!y || !m) return 'Unknown';
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

const TABS = [
  { label: 'All', value: 'all' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function RideHistoryScreen({ navigation }) {
  const [rides, setRides]           = useState([]);
  const [page, setPage]             = useState(1);
  const [hasMore, setHasMore]       = useState(true);
  const [loading, setLoading]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'completed' | 'cancelled'>('all');

  const fetchRides = useCallback(async (pageNum: number, replace = false) => {
    if (loading && !replace) return;
    pageNum === 1 ? setRefreshing(true) : setLoading(true);
    const { data } = await ridesApi.myRides(pageNum, PAGE_SIZE);
    pageNum === 1 ? setRefreshing(false) : setLoading(false);
    setInitialLoading(false);
    if (!data?.data) return;
    const normalize = (r: any) => ({ ...r, from: r.fromCity || r.from, to: r.toCity || r.to });
    const items = (data.data || []).map(normalize)
      .filter((r: any) => r.status === 'COMPLETED' || r.status === 'CANCELLED' || r.status === 'EXPIRED');
    setRides(prev => replace ? items : [...prev, ...items]);
    setHasMore(data.meta?.hasNext ?? false);
    setPage(pageNum);
  }, []);

  useFocusEffect(useCallback(() => {
    fetchRides(1, true);
  }, [fetchRides]));

  // Tab filter — reuses the same status set already fetched, just narrows it.
  const filteredRides = useMemo(() => {
    if (tab === 'completed') return rides.filter((r: any) => r.status === 'COMPLETED');
    if (tab === 'cancelled') return rides.filter((r: any) => r.status === 'CANCELLED' || r.status === 'EXPIRED');
    return rides;
  }, [rides, tab]);

  // Group by month, preserving the API's (newest-first) ordering.
  const sections = useMemo(() => {
    const order: string[] = [];
    const map: Record<string, any[]> = {};
    filteredRides.forEach((r: any) => {
      const key = monthKey(r.date);
      if (!map[key]) { map[key] = []; order.push(key); }
      map[key].push(r);
    });
    return order.map(title => ({ title, data: map[title] }));
  }, [filteredRides]);

  const renderRide = ({ item }: any) => {
    const confirmedSeats = (item.bookings || [])
      .filter((b: any) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
      .reduce((s: number, b: any) => s + (b.seats || 1), 0);
    const earned = confirmedSeats * item.pricePerSeat;
    const pill = historyPillStyle(item.status);

    return (
      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate('RideBookings', { rideId: item.id })}
      >
        <View style={styles.cardTop}>
          <Text style={styles.routeText} numberOfLines={1}>{item.from} → {item.to}</Text>
          <View style={[styles.pill, { backgroundColor: pill.bg }]}>
            <Text style={[styles.pillText, { color: pill.text }]}>{historyPillLabel(item.status)}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={13} color={COLORS.gray} />
          <Text style={styles.metaText}>{item.date}</Text>
          <Ionicons name="time-outline" size={13} color={COLORS.gray} style={{ marginLeft: 10 }} />
          <Text style={styles.metaText}>{item.departureTime}</Text>
          <Ionicons name="people-outline" size={13} color={COLORS.gray} style={{ marginLeft: 10 }} />
          <Text style={styles.metaText}>{confirmedSeats}</Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.earningsLabel}>Earnings</Text>
          <Text style={styles.earningsValue}>Rs {earned.toLocaleString()}</Text>
        </View>
      </Pressable>
    );
  };

  if (initialLoading) {
    return (
      <View style={styles.container}>
        <AppBar title="Ride History" onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} />
        <View style={styles.list}>
          {Array.from({ length: 5 }).map((_, i) => <RideCardSkeleton key={i} />)}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppBar title="Ride History" onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} />

      <TabPills tabs={TABS} activeTab={tab} onSelect={(v) => setTab(v)} style={styles.tabRow} />

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={renderRide}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        stickySectionHeadersEnabled={false}
        onEndReached={() => { if (hasMore && !loading) fetchRides(page + 1); }}
        onEndReachedThreshold={0.3}
        refreshing={refreshing}
        onRefresh={() => fetchRides(1, true)}
        ListFooterComponent={loading ? <ActivityIndicator color={COLORS.teal} style={{ marginVertical: 16 }} /> : null}
        ListEmptyComponent={
          !refreshing ? (
            <EmptyState icon="car-outline" title="No Ride History"
              subtitle="Completed and cancelled rides will appear here." />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.bg },
  loadingCenter:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabRow:         { marginHorizontal: 16, marginBottom: 4 },
  list:           { padding: 16, paddingBottom: 32 },
  sectionHeader:  { fontSize: 13, fontWeight: '700', color: COLORS.gray, textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 12, marginBottom: 8 },
  card:           { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, ...CURVE },
  cardTop:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 },
  routeText:      { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  pill:           { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pillText:       { fontSize: 11, fontWeight: '700' },
  metaRow:        { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 12, marginBottom: 10 },
  metaText:       { fontSize: 11.5, color: COLORS.gray, fontWeight: '600', marginLeft: 4 },
  cardFooter:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  earningsLabel:  { fontSize: 11, color: COLORS.gray, textTransform: 'uppercase' },
  earningsValue:  { fontSize: 18, fontWeight: '700', color: COLORS.teal },
});
