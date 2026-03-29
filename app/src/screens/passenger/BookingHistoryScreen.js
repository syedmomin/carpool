import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, EmptyState, GradientHeader, StatusBadge } from '../../components';
import { useApp } from '../../context/AppContext';
import { useGlobalModal } from '../../context/GlobalModalContext';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../utils/errorMessages';
import { bookingsApi } from '../../services/api';

const PAGE_SIZE = 10;

export default function BookingHistoryScreen({ navigation }) {
  const { cancelBooking } = useApp();
  const { showModal } = useGlobalModal();
  const { showToast } = useToast();

  const [bookings,   setBookings]   = useState([]);
  const [page,       setPage]       = useState(1);
  const [hasMore,    setHasMore]    = useState(true);
  const [loading,    setLoading]    = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = useCallback(async (pageNum, replace = false) => {
    if (loading && !replace) return;
    pageNum === 1 ? setRefreshing(true) : setLoading(true);
    const { data } = await bookingsApi.myBookings(pageNum, PAGE_SIZE);
    pageNum === 1 ? setRefreshing(false) : setLoading(false);

    if (!data?.data) return;
    const normalize = b => ({
      ...b,
      ride: b.ride ? { ...b.ride, from: b.ride.fromCity || b.ride.from, to: b.ride.toCity || b.ride.to } : null,
    });
    const items = (data.data || []).map(normalize);
    setBookings(prev => replace ? items : [...prev, ...items]);
    setHasMore(data.meta?.hasNext ?? false);
    setPage(pageNum);
  }, []);

  // Reload when screen comes into focus
  useFocusEffect(useCallback(() => {
    fetchBookings(1, true);
  }, []));

  const loadMore = () => {
    if (hasMore && !loading && !refreshing) fetchBookings(page + 1);
  };

  const confirmCancel = (bookingId) => {
    showModal({
      type: 'danger',
      title: 'Cancel Booking?',
      message: 'Are you sure you want to cancel this booking? This action cannot be undone.',
      confirmText: 'Yes, Cancel',
      cancelText: 'Keep Booking',
      icon: 'close-circle-outline',
      onConfirm: async () => {
        const { error } = await cancelBooking(bookingId);
        if (error) showToast(parseApiError(error), 'error');
        else {
          showToast('Booking cancelled.', 'info');
          setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'CANCELLED' } : b));
        }
      },
    });
  };

  const renderBooking = ({ item }) => {
    const ride         = item.ride;
    if (!ride) return null;
    const fromCity     = ride.boardingCity || item.boardingCity || ride.from || '';
    const toCity       = ride.exitCity     || item.exitCity     || ride.to   || '';
    const driverName   = ride.driver?.name  || 'N/A';
    const driverPhone  = ride.driver?.phone || '';
    const vehicle      = ride.vehicle;
    const vehicleLabel = vehicle ? `${vehicle.brand} · ${vehicle.plateNumber}` : 'N/A';
    const isActive     = item.status === 'CONFIRMED' || item.status === 'confirmed';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.routeCol}>
            <View style={styles.routeRow}>
              <View style={styles.cityDot} />
              <Text style={styles.city}>{fromCity}</Text>
            </View>
            <View style={styles.routeLine2} />
            <View style={styles.routeRow}>
              <View style={[styles.cityDot, { backgroundColor: COLORS.secondary }]} />
              <Text style={styles.city}>{toCity}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <StatusBadge status={item.status} />
            <Text style={styles.dateText}>{ride.date}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <View style={styles.detailIcon}>
              <Ionicons name="person" size={14} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.detailLabel}>Driver</Text>
              <Text style={styles.detailValue}>{driverName}</Text>
              {!!driverPhone && <Text style={styles.detailSub}>{driverPhone}</Text>}
            </View>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailItem}>
            <View style={[styles.detailIcon, { backgroundColor: '#e0f7fa' }]}>
              <Ionicons name="car" size={14} color={COLORS.teal} />
            </View>
            <View>
              <Text style={styles.detailLabel}>Vehicle</Text>
              <Text style={styles.detailValue}>{vehicleLabel}</Text>
              {vehicle?.type && <Text style={styles.detailSub}>{vehicle.type}{vehicle.ac ? ' · AC' : ''}</Text>}
            </View>
          </View>
        </View>

        <View style={styles.chipsRow}>
          <View style={styles.chip}>
            <Ionicons name="time-outline" size={12} color={COLORS.gray} />
            <Text style={styles.chipText}>{ride.departureTime}</Text>
          </View>
          <View style={styles.chip}>
            <Ionicons name="people-outline" size={12} color={COLORS.gray} />
            <Text style={styles.chipText}>{item.seats} seat{item.seats !== 1 ? 's' : ''}</Text>
          </View>
          {item.boardingCity && item.boardingCity !== ride.from && (
            <View style={[styles.chip, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="git-branch-outline" size={12} color={COLORS.primary} />
              <Text style={[styles.chipText, { color: COLORS.primary }]}>Segment</Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.amountLabel}>Total Paid</Text>
            <Text style={styles.amountValue}>Rs {item.totalAmount?.toLocaleString()}</Text>
          </View>
          {isActive && (
            <TouchableOpacity style={styles.cancelBtn} onPress={() => confirmCancel(item.id)}>
              <Ionicons name="close-circle-outline" size={16} color={COLORS.danger} />
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <GradientHeader
        colors={GRADIENTS.primary}
        title="My Bookings"
        subtitle={`${bookings.length} booking${bookings.length !== 1 ? 's' : ''}`}
        onBack={() => navigation.goBack()}
      />
      <FlatList
        data={bookings}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderBooking}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        refreshing={refreshing}
        onRefresh={() => fetchBookings(1, true)}
        ListFooterComponent={loading ? <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 16 }} /> : null}
        ListEmptyComponent={
          !refreshing ? (
            <EmptyState
              icon="receipt-outline"
              title="No Bookings"
              subtitle="You haven't booked any rides yet."
            />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.bg },
  listContent:  { padding: 16, paddingBottom: 80 },
  card:         { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  routeCol:     { flex: 1 },
  routeRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeLine2:   { width: 2, height: 12, backgroundColor: COLORS.border, marginLeft: 3, marginVertical: 2 },
  cityDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  city:         { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  headerRight:  { alignItems: 'flex-end', gap: 6 },
  dateText:     { fontSize: 11, color: COLORS.gray, fontWeight: '600' },
  detailRow:     { flexDirection: 'row', backgroundColor: COLORS.lightGray, borderRadius: 14, padding: 12, marginBottom: 12 },
  detailItem:    { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  detailDivider: { width: 1, backgroundColor: COLORS.border, marginHorizontal: 8 },
  detailIcon:    { width: 30, height: 30, borderRadius: 8, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  detailLabel:   { fontSize: 10, color: COLORS.gray, marginBottom: 2 },
  detailValue:   { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  detailSub:     { fontSize: 11, color: COLORS.gray, marginTop: 1 },
  chipsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip:         { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.lightGray, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  chipText:     { fontSize: 12, fontWeight: '600', color: COLORS.gray },
  cardFooter:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
  amountLabel:  { fontSize: 11, color: COLORS.gray },
  amountValue:  { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  cancelBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fff0f0', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: COLORS.danger + '30' },
  cancelBtnText:{ fontSize: 13, fontWeight: '700', color: COLORS.danger },
});
