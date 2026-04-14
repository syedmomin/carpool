import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, EmptyState, GradientHeader, StatusBadge } from '../../components';
import { ridesApi } from '../../services/api';

const PAGE_SIZE = 10;

export default function RideHistoryScreen({ navigation }) {
  const [rides, setRides]           = useState([]);
  const [page, setPage]             = useState(1);
  const [hasMore, setHasMore]       = useState(true);
  const [loading, setLoading]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

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

  const renderRide = ({ item }: any) => {
    const confirmedSeats = (item.bookings || [])
      .filter((b: any) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
      .reduce((s: number, b: any) => s + (b.seats || 1), 0);
    const earned = confirmedSeats * item.pricePerSeat;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('RideBookings', { rideId: item.id })}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <View style={styles.routeRow}>
              <View style={styles.cityDot} />
              <Text style={styles.cityText}>{item.from}</Text>
            </View>
            <View style={styles.routeConnector} />
            <View style={styles.routeRow}>
              <View style={[styles.cityDot, { backgroundColor: COLORS.secondary }]} />
              <Text style={styles.cityText}>{item.to}</Text>
            </View>
          </View>
          <StatusBadge status={item.status} />
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.metaCol}>
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.gray} />
              <Text style={styles.metaText}>{item.date}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={14} color={COLORS.gray} />
              <Text style={styles.metaText}>{item.departureTime}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="people-outline" size={14} color={COLORS.gray} />
              <Text style={styles.metaText}>{confirmedSeats} Passengers</Text>
            </View>
          </View>
          <View style={styles.earningsCol}>
            <Text style={styles.earningsLabel}>Earnings</Text>
            <Text style={styles.earningsValue}>Rs {earned.toLocaleString()}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (initialLoading) {
    return (
      <View style={styles.container}>
        <GradientHeader colors={GRADIENTS.teal as any} title="Ride History"
          subtitle="Your past hosting activity"
          onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
        />
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={COLORS.teal} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GradientHeader
        colors={GRADIENTS.teal as any}
        title="Ride History"
        subtitle="Completed and cancelled rides"
        onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      />
      <FlatList
        data={rides}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={renderRide}
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
  list:           { padding: 16, paddingBottom: 100 },
  card:           { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#f0f0f0' },
  cardHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  routeRow:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cityDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  cityText:       { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  routeConnector: { width: 2, height: 12, backgroundColor: COLORS.border, marginLeft: 3, marginVertical: 4 },
  cardFooter:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
  metaCol:        { gap: 6 },
  metaRow:        { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText:       { fontSize: 13, color: COLORS.gray, fontWeight: '600' },
  earningsCol:    { alignItems: 'flex-end' },
  earningsLabel:  { fontSize: 10, color: COLORS.gray, textTransform: 'uppercase', marginBottom: 2 },
  earningsValue:  { fontSize: 18, fontWeight: '900', color: COLORS.teal },
});
