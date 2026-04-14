import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, EmptyState, GradientHeader, StatusBadge, ProgressBar } from '../../components';
import { useGlobalModal } from '../../context/GlobalModalContext';
import { useToast } from '../../context/ToastContext';
import { ridesApi } from '../../services/api';
import { socketService } from '../../services/socket.service';

const PAGE_SIZE = 10;

export default function ActiveRidesScreen({ navigation }) {
  const { showModal } = useGlobalModal();
  const { showToast } = useToast();

  const [rides, setRides]             = useState([]);
  const [page, setPage]               = useState(1);
  const [hasMore, setHasMore]         = useState(true);
  const [loading, setLoading]         = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [actionLoading, setActionLoading]   = useState<string | null>(null);

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  })();

  const normalize = (r: any) => ({ ...r, from: r.fromCity || r.from, to: r.toCity || r.to });

  const fetchRides = useCallback(async (pageNum: number, replace = false) => {
    if (loading && !replace) return;
    pageNum === 1 ? setRefreshing(true) : setLoading(true);
    const { data } = await ridesApi.myRides(pageNum, PAGE_SIZE);
    pageNum === 1 ? setRefreshing(false) : setLoading(false);
    setInitialLoading(false);
    if (!data?.data) return;
    const all   = (data.data || []).map(normalize);
    const items = all.filter((r: any) => r.status === 'ACTIVE' || r.status === 'IN_PROGRESS');
    setRides(prev => replace ? items : [...prev, ...items]);
    setHasMore(data.meta?.hasNext ?? false);
    setPage(pageNum);
  }, []);

  useFocusEffect(useCallback(() => {
    fetchRides(1, true);

    const refresh = () => fetchRides(1, true);
    socketService.on('BOOKING_REQUESTED', refresh);
    socketService.on('BOOKING_CANCELLED', refresh);
    return () => {
      socketService.off('BOOKING_REQUESTED', refresh);
      socketService.off('BOOKING_CANCELLED', refresh);
    };
  }, [fetchRides]));

  const handleStartRide = (ride: any) => {
    if (!ride.vehicle) {
      showModal({
        type: 'danger',
        title: 'Vehicle Required',
        message: 'Register and activate a vehicle before starting a ride.',
        confirmText: 'Set Up Vehicle',
        cancelText: 'Cancel',
        icon: 'car-outline',
        onConfirm: () => navigation.navigate('MyVehicles'),
      });
      return;
    }
    showModal({
      type: 'primary',
      title: 'Start Ride?',
      message: 'This will notify all confirmed passengers that the ride has started.',
      confirmText: 'Start Ride',
      cancelText: 'Cancel',
      icon: 'play-circle-outline',
      onConfirm: async () => {
        setActionLoading(ride.id);
        const { error } = await ridesApi.updateStatus(ride.id, 'IN_PROGRESS');
        setActionLoading(null);
        if (error) showToast(error, 'error');
        else {
          showToast('Ride started! Opening tracking...', 'success');
          navigation.navigate('RideTracking', { rideId: ride.id });
        }
      },
    });
  };

  const handleCancelRide = (ride: any) => {
    showModal({
      type: 'danger',
      title: 'Cancel Ride?',
      message: 'Are you sure? All passengers will be notified.',
      confirmText: 'Yes, Cancel',
      cancelText: 'No',
      icon: 'close-circle-outline',
      onConfirm: async () => {
        setActionLoading(ride.id);
        const { error } = await ridesApi.cancel(ride.id);
        setActionLoading(null);
        if (error) showToast(error, 'error');
        else { showToast('Ride cancelled', 'info'); fetchRides(1, true); }
      },
    });
  };

  const renderRide = ({ item }: any) => {
    const vehicle        = item.vehicle;
    const confirmedSeats = (item.bookings || [])
      .filter((b: any) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
      .reduce((s: number, b: any) => s + (b.seats || 1), 0);
    const available         = item.totalSeats - item.bookedSeats;
    const fillPercent       = confirmedSeats / item.totalSeats;
    const earned            = confirmedSeats * item.pricePerSeat;
    const isActioning       = actionLoading === item.id;
    const isActive          = item.status === 'ACTIVE';
    const isInProgress      = item.status === 'IN_PROGRESS';
    const isToday           = item.date === todayStr;
    const hasAnyBooking     = (item.bookings || []).length > 0;
    const isExpiredNoBook   = isActive && !hasAnyBooking && item.date < todayStr;

    return (
      <View style={styles.card}>
        {isInProgress && (
          <LinearGradient colors={GRADIENTS.teal as any} style={styles.inProgressBanner}>
            <Ionicons name="navigate-outline" size={14} color="#fff" />
            <Text style={styles.inProgressText}>Ride In Progress</Text>
          </LinearGradient>
        )}

        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.route}>{item.from} → {item.to}</Text>
            <Text style={styles.date}>{item.date} • {item.departureTime}</Text>
          </View>
          <StatusBadge
            status={
              isInProgress      ? 'in_progress' :
              isExpiredNoBook   ? 'expired_no_bookings' :
              !hasAnyBooking    ? 'no_requests' :
              available > 0     ? (isToday ? 'active' : 'pending') : 'pending'
            }
            label={
              isInProgress      ? 'In Progress' :
              isExpiredNoBook   ? 'Expired – No Bookings' :
              !hasAnyBooking    ? 'No Requests Yet' :
              available > 0     ? (isToday ? 'Scheduled Today' : 'Scheduled') : 'Full'
            }
          />
        </View>

        <ProgressBar
          value={fillPercent}
          label={`Confirmed Seats: ${confirmedSeats}/${item.totalSeats}`}
          caption={`${Math.round(fillPercent * 100)}%`}
          style={styles.progress}
        />

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="people-outline" size={16} color={COLORS.primary} />
            <Text style={styles.statText}>{confirmedSeats} confirmed</Text>
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

        <View style={styles.actions}>
          <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('RideBookings', { rideId: item.id })}>
            <Ionicons name="people-outline" size={16} color={COLORS.primary} />
            <Text style={styles.btnText}>Passengers ({confirmedSeats}/{item.totalSeats})</Text>
          </TouchableOpacity>

          {isActive && item.bookings?.some((b: any) => b.status === 'CONFIRMED') && isToday && (
            <TouchableOpacity
              style={[styles.btn, styles.startBtn]}
              onPress={() => handleStartRide(item)}
              disabled={isActioning}
            >
              {isActioning ? <ActivityIndicator size="small" color="#fff" /> : (
                <LinearGradient colors={['#2e7d32','#1b5e20']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.startGrad}>
                  <Ionicons name="play" size={16} color="#fff" />
                  <Text style={styles.startText}>START TRIP NOW</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          )}

          {isInProgress && (
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: COLORS.primary, borderColor: 'transparent' }]}
              onPress={() => navigation.navigate('RideTracking', { rideId: item.id })}
            >
              <Ionicons name="navigate-outline" size={16} color="#fff" />
              <Text style={[styles.btnText, { color: '#fff' }]}>Open Tracking</Text>
            </TouchableOpacity>
          )}

          {isActive && (
            <TouchableOpacity
              style={[styles.btn, { borderColor: COLORS.danger + '50' }]}
              onPress={() => handleCancelRide(item)}
            >
              <Ionicons name="close-circle-outline" size={16} color={COLORS.danger} />
              <Text style={[styles.btnText, { color: COLORS.danger }]}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (initialLoading) {
    return (
      <View style={styles.container}>
        <GradientHeader colors={GRADIENTS.teal as any} title="My Rides"
          onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
          rightIcon="time-outline" onRightPress={() => navigation.navigate('RideHistory')}
        />
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={COLORS.teal} />
          <Text style={styles.loadingText}>Loading your rides...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GradientHeader
        colors={GRADIENTS.teal as any}
        title="My Rides"
        subtitle="Active and in-progress rides"
        onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
        rightIcon="time-outline"
        onRightPress={() => navigation.navigate('RideHistory')}
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
            <EmptyState icon="car-sport-outline" title="No Active Rides"
              subtitle="You have no active rides right now. Post a new ride!" />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.bg },
  loadingCenter:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText:     { fontSize: 14, color: COLORS.gray },
  list:            { padding: 16, paddingBottom: 100 },
  card:            { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  inProgressBanner:{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7 },
  inProgressText:  { fontSize: 12, fontWeight: '700', color: '#fff' },
  cardHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16, paddingBottom: 0, marginBottom: 14 },
  route:           { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  date:            { fontSize: 12, color: COLORS.gray, marginTop: 3 },
  progress:        { marginHorizontal: 16, marginBottom: 12 },
  statsRow:        { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.lightGray, marginHorizontal: 16, borderRadius: 12, padding: 12, marginBottom: 12 },
  stat:            { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText:        { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary },
  actions:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16, paddingTop: 0 },
  btn:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: COLORS.primary + '40', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, gap: 6, minWidth: 100 },
  btnText:         { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  startBtn:        { paddingVertical: 0, paddingHorizontal: 0, borderWidth: 0, minWidth: 150 },
  startGrad:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, gap: 8, width: '100%' },
  startText:       { fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
});
