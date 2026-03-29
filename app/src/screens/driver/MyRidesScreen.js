import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, EmptyState, GradientHeader, TabPills, StatusBadge, ProgressBar, FAB } from '../../components';
import { useGlobalModal } from '../../context/GlobalModalContext';
import { ridesApi } from '../../services/api';

const PAGE_SIZE = 10;
const TABS = [
  { value: 0, label: 'Active' },
  { value: 1, label: 'All' },
];

export default function MyRidesScreen({ navigation }) {
  const { showModal } = useGlobalModal();
  const [activeTab,  setActiveTab]  = useState(0);
  const [allRides,   setAllRides]   = useState([]);
  const [page,       setPage]       = useState(1);
  const [hasMore,    setHasMore]    = useState(true);
  const [loading,    setLoading]    = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const normalize = r => ({ ...r, from: r.fromCity || r.from, to: r.toCity || r.to });

  const fetchRides = useCallback(async (pageNum, replace = false) => {
    if (loading && !replace) return;
    pageNum === 1 ? setRefreshing(true) : setLoading(true);
    const { data } = await ridesApi.myRides(pageNum, PAGE_SIZE);
    pageNum === 1 ? setRefreshing(false) : setLoading(false);
    if (!data?.data) return;
    const items = (data.data || []).map(normalize);
    setAllRides(prev => replace ? items : [...prev, ...items]);
    setHasMore(data.meta?.hasNext ?? false);
    setPage(pageNum);
  }, []);

  useFocusEffect(useCallback(() => {
    fetchRides(1, true);
  }, []));

  const loadMore = () => {
    if (hasMore && !loading && !refreshing) fetchRides(page + 1);
  };

  const rides = activeTab === 0 ? allRides.filter(r => r.status === 'ACTIVE') : allRides;

  const renderRide = ({ item }) => {
    const vehicle = item.vehicle;
    const available = item.totalSeats - item.bookedSeats;
    const fillPercent = item.bookedSeats / item.totalSeats;
    const earned = item.bookedSeats * item.pricePerSeat;

    return (
      <View style={styles.rideCard}>
        <View style={styles.rideHeader}>
          <View>
            <Text style={styles.rideRoute}>{item.from} → {item.to}</Text>
            <Text style={styles.rideDate}>{item.date} • {item.departureTime}</Text>
          </View>
          <StatusBadge status={available > 0 ? 'active' : 'pending'} label={available > 0 ? 'Open' : 'Full'} />
        </View>

        <ProgressBar
          value={fillPercent}
          label={`Seats Booked: ${item.bookedSeats}/${item.totalSeats}`}
          caption={`${Math.round(fillPercent * 100)}%`}
          style={styles.progress}
        />

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="people-outline" size={16} color={COLORS.primary} />
            <Text style={styles.statText}>{item.bookedSeats} passengers</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="cash-outline" size={16} color={COLORS.secondary} />
            <Text style={styles.statText}>Rs {earned.toLocaleString()} earned</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="car-outline" size={16} color={COLORS.gray} />
            <Text style={styles.statText}>{vehicle?.type || 'Vehicle'}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="people-outline" size={16} color={COLORS.primary} />
            <Text style={styles.actionBtnText}>Passengers ({item.bookedSeats})</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: COLORS.danger + '50' }]}
            onPress={() => showModal({
              type: 'danger',
              title: 'Cancel Ride?',
              message: 'Are you sure you want to cancel this ride? Passengers will be notified.',
              confirmText: 'Yes, Cancel',
              cancelText: 'No',
            })}
          >
            <Ionicons name="close-circle-outline" size={16} color={COLORS.danger} />
            <Text style={[styles.actionBtnText, { color: COLORS.danger }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <GradientHeader
        colors={GRADIENTS.teal}
        title="My Rides"
        onBack={() => navigation.goBack()}
      >
        <View style={styles.headerStats}>
          {[
            { val: allRides.length,                                                                           label: 'Total'  },
            { val: allRides.filter(r => r.status === 'ACTIVE').length,                                       label: 'Active' },
            { val: `Rs ${allRides.reduce((s, r) => s + (r.bookedSeats * r.pricePerSeat || 0), 0).toLocaleString()}`, label: 'Earned', accent: true },
          ].map((s, i) => (
            <View key={i} style={styles.headerStat}>
              <Text style={[styles.headerStatVal, s.accent && { color: COLORS.accent }]}>{s.val}</Text>
              <Text style={styles.headerStatLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </GradientHeader>

      <TabPills
        tabs={TABS}
        activeTab={activeTab}
        onSelect={setActiveTab}
        color={COLORS.teal}
        style={styles.tabs}
      />

      <FlatList
        data={rides}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderRide}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        refreshing={refreshing}
        onRefresh={() => fetchRides(1, true)}
        ListFooterComponent={loading ? <ActivityIndicator color={COLORS.teal} style={{ marginVertical: 16 }} /> : null}
        ListEmptyComponent={
          !refreshing ? (
            <EmptyState
              icon="car-sport-outline"
              title="No Rides Found"
              subtitle="You haven't posted any rides yet. Post your first ride!"
            />
          ) : null
        }
      />

      <FAB icon="add" onPress={() => navigation.navigate('PostRide')} colors={GRADIENTS.teal} style={styles.fab} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  headerStats: { flexDirection: 'row', gap: 20, marginTop: 12 },
  headerStat: { alignItems: 'center' },
  headerStatVal: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  tabs: { margin: 16 },
  listContent: { padding: 16, paddingBottom: 80 },
  rideCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  rideHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  rideRoute: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  rideDate: { fontSize: 12, color: COLORS.gray, marginTop: 3 },
  progress: { marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 12, marginBottom: 12 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: COLORS.primary + '40', borderRadius: 10, paddingVertical: 8, gap: 6 },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  fab: { position: 'absolute', bottom: 24, right: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
});
