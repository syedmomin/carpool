import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, EmptyState, GradientHeader, StatusBadge, ProgressBar, RideCardSkeleton } from '../../components';
import { useSocketData } from '../../context/SocketDataContext';
import { useGlobalModal } from '../../context/GlobalModalContext';
import { useToast } from '../../context/ToastContext';
import { ridesApi } from '../../services/api';

export default function ActiveRidesScreen({ navigation }) {
  const { showModal } = useGlobalModal();
  const { showToast } = useToast();
  const { myRides, myRidesState, loadMyRides, patchRide } = useSocketData();

  const [tab, setTab] = useState<'current' | 'history'>('current');
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  // Load once on first focus; socket keeps it live after that
  useFocusEffect(useCallback(() => {
    loadMyRides();
  }, [loadMyRides]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMyRides(true);
    setRefreshing(false);
  };

  const currentRides = myRides.filter(r => r.status === 'ACTIVE' || r.status === 'IN_PROGRESS');
  const historyRides = myRides.filter(r => r.status === 'COMPLETED' || r.status === 'CANCELLED' || r.status === 'EXPIRED');

  const handleStartRide = (ride: any) => {
    if (!ride.vehicle) {
      showModal({
        type: 'danger', title: 'Vehicle Required',
        message: 'Register and activate a vehicle before starting a ride.',
        confirmText: 'Set Up Vehicle', cancelText: 'Cancel', icon: 'car-outline',
        onConfirm: () => navigation.navigate('MyVehicles'),
      });
      return;
    }
    showModal({
      type: 'primary', title: 'Start Ride?',
      message: 'This will notify all confirmed passengers that the ride has started.',
      confirmText: 'Start Ride', cancelText: 'Cancel', icon: 'play-circle-outline',
      onConfirm: async () => {
        setActionLoading(ride.id);
        const { error } = await ridesApi.updateStatus(ride.id, 'IN_PROGRESS');
        setActionLoading(null);
        if (error) showToast(error, 'error');
        else {
          patchRide(ride.id, { status: 'IN_PROGRESS' });
          showToast('Ride started! Opening tracking...', 'success');
          navigation.navigate('RideTracking', { rideId: ride.id });
        }
      },
    });
  };

  const handleCancelRide = (ride: any) => {
    showModal({
      type: 'danger', title: 'Cancel Ride?',
      message: 'Are you sure? All passengers will be notified.',
      confirmText: 'Yes, Cancel', cancelText: 'No', icon: 'close-circle-outline',
      onConfirm: async () => {
        setActionLoading(ride.id);
        const { error } = await ridesApi.cancel(ride.id);
        setActionLoading(null);
        if (error) showToast(error, 'error');
        else {
          patchRide(ride.id, { status: 'CANCELLED' });
          showToast('Ride cancelled', 'info');
        }
      },
    });
  };

  const renderCurrentRide = ({ item }: any) => {
    const vehicle = item.vehicle;
    const confirmedSeats = (item.bookings || [])
      .filter((b: any) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
      .reduce((s: number, b: any) => s + (b.seats || 1), 0);
    const available = item.totalSeats - item.bookedSeats;
    const fillPercent = confirmedSeats / item.totalSeats;
    const earned = confirmedSeats * item.pricePerSeat;
    const isActioning = actionLoading === item.id;
    const isActive = item.status === 'ACTIVE';
    const isInProgress = item.status === 'IN_PROGRESS';
    const isToday = item.date === todayStr;
    const hasAnyBooking = (item.bookings || []).length > 0;
    const isExpiredNoBook = isActive && !hasAnyBooking && item.date < todayStr;

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
              isInProgress ? 'in_progress' :
                isExpiredNoBook ? 'expired_no_bookings' :
                  !hasAnyBooking ? 'no_requests' :
                    available > 0 ? (isToday ? 'active' : 'pending') : 'pending'
            }
            label={
              isInProgress ? 'In Progress' :
                isExpiredNoBook ? 'Expired – No Bookings' :
                  !hasAnyBooking ? 'No Requests Yet' :
                    available > 0 ? (isToday ? 'Scheduled Today' : 'Scheduled') : 'Full'
            }
          />
        </View>
        <ProgressBar value={fillPercent} label={`Confirmed Seats: ${confirmedSeats}/${item.totalSeats}`}
          caption={`${Math.round(fillPercent * 100)}%`} style={styles.progress} />
        <View style={styles.statsRow}>
          <View style={styles.stat}><Ionicons name="people-outline" size={16} color={COLORS.primary} /><Text style={styles.statText}>{confirmedSeats} confirmed</Text></View>
          <View style={styles.stat}><Ionicons name="cash-outline" size={16} color={COLORS.secondary} /><Text style={styles.statText}>Rs {earned.toLocaleString()} earned</Text></View>
          <View style={styles.stat}><Ionicons name="car-outline" size={16} color={COLORS.gray} /><Text style={styles.statText}>{vehicle?.type || 'Vehicle'}</Text></View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('RideBookings', { rideId: item.id })}>
            <Ionicons name="people-outline" size={16} color={COLORS.primary} />
            <Text style={styles.btnText}>Passengers ({confirmedSeats}/{item.totalSeats})</Text>
          </TouchableOpacity>
          {isActive && (
            <TouchableOpacity
              style={[styles.btn, { borderColor: COLORS.danger + '50' }, isActioning && { opacity: 0.45 }]}
              onPress={() => handleCancelRide(item)} disabled={isActioning}>
              <Ionicons name="close-circle-outline" size={16} color={COLORS.danger} />
              <Text style={[styles.btnText, { color: COLORS.danger }]}>Cancel</Text>
            </TouchableOpacity>
          )}
          {isActive && item.bookings?.some((b: any) => b.status === 'CONFIRMED') && isToday && (
            <TouchableOpacity style={[styles.btn, styles.startBtn]} onPress={() => handleStartRide(item)} disabled={isActioning}>
              {isActioning ? <ActivityIndicator size="small" color="#fff" /> : (
                <LinearGradient colors={['#2e7d32', '#1b5e20']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.startGrad}>
                  <Ionicons name="play" size={16} color="#fff" />
                  <Text style={styles.startText}>START TRIP NOW</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          )}
          {isInProgress && (
            <TouchableOpacity style={[styles.btn, { backgroundColor: COLORS.primary, borderColor: 'transparent' }]}
              onPress={() => navigation.navigate('RideTracking', { rideId: item.id })}>
              <Ionicons name="navigate-outline" size={16} color="#fff" />
              <Text style={[styles.btnText, { color: '#fff' }]}>Open Tracking</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderHistoryRide = ({ item }: any) => {
    const confirmedSeats = (item.bookings || [])
      .filter((b: any) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
      .reduce((s: number, b: any) => s + (b.seats || 1), 0);
    const earned = confirmedSeats * item.pricePerSeat;
    const statusConfig = {
      COMPLETED: { color: COLORS.secondary, bg: '#e8f5e9', label: 'Completed' },
      CANCELLED: { color: COLORS.danger, bg: '#fef2f2', label: 'Cancelled' },
      EXPIRED: { color: '#92400e', bg: '#fffbeb', label: 'Expired' },
    }[item.status] || { color: COLORS.gray, bg: COLORS.lightGray, label: item.status };

    return (
      <View style={[styles.card, styles.historyCard]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.route}>{item.from} → {item.to}</Text>
            <Text style={styles.date}>{item.date} • {item.departureTime}</Text>
          </View>
          <View style={[styles.historyBadge, { backgroundColor: statusConfig.bg }]}>
            <Text style={[styles.historyBadgeText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.stat}><Ionicons name="people-outline" size={16} color={COLORS.primary} /><Text style={styles.statText}>{confirmedSeats} passengers</Text></View>
          <View style={styles.stat}><Ionicons name="cash-outline" size={16} color={COLORS.secondary} /><Text style={styles.statText}>Rs {earned.toLocaleString()}</Text></View>
          <View style={styles.stat}><Ionicons name="car-outline" size={16} color={COLORS.gray} /><Text style={styles.statText}>{item.vehicle?.type || 'Vehicle'}</Text></View>
        </View>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('RideBookings', { rideId: item.id })}>
          <Ionicons name="people-outline" size={16} color={COLORS.primary} />
          <Text style={styles.btnText}>View Passengers</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const isInitialLoad = !myRidesState.loaded && myRidesState.loading;

  if (isInitialLoad) {
    return (
      <View style={styles.container}>
        <GradientHeader colors={GRADIENTS.teal as any} title="My Rides"
          rightIcon="add-outline" onRightPress={() => navigation.navigate('PostRide')} />
        <FlatList
          data={[1, 2, 3]}
          keyExtractor={item => item.toString()}
          contentContainerStyle={styles.list}
          renderItem={() => <RideCardSkeleton />}
        />
      </View>
    );
  }

  const data = tab === 'current' ? currentRides : historyRides;
  const renderItem = tab === 'current' ? renderCurrentRide : renderHistoryRide;

  return (
    <View style={styles.container}>
      <GradientHeader colors={GRADIENTS.teal as any} title="My Rides"
        subtitle={tab === 'current' ? 'Active and in-progress rides' : 'Past ride history'}
        rightIcon="add-outline" onRightPress={() => navigation.navigate('PostRide')} />
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'current' && styles.tabActive]} onPress={() => setTab('current')}>
          <Ionicons name="car-sport-outline" size={16} color={tab === 'current' ? COLORS.primary : COLORS.gray} />
          <Text style={[styles.tabText, tab === 'current' && styles.tabTextActive]}>
            Current {currentRides.length > 0 ? `(${currentRides.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'history' && styles.tabActive]} onPress={() => setTab('history')}>
          <Ionicons name="time-outline" size={16} color={tab === 'history' ? COLORS.primary : COLORS.gray} />
          <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>
            History {historyRides.length > 0 ? `(${historyRides.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          !refreshing ? (
            tab === 'current'
              ? <EmptyState icon="car-sport-outline" title="No Active Rides"
                subtitle="You have no active rides. Post a new ride!"
                action={{ label: 'Post a Ride', onPress: () => navigation.navigate('PostRide') }} />
              : <EmptyState icon="time-outline" title="No Ride History"
                subtitle="Your completed and cancelled rides will appear here." />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: COLORS.gray },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2.5, borderBottomColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  tabTextActive: { color: COLORS.primary, fontWeight: '800' },
  list: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  historyCard: { opacity: 0.9 },
  inProgressBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7 },
  inProgressText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16, paddingBottom: 0, marginBottom: 14 },
  route: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  date: { fontSize: 12, color: COLORS.gray, marginTop: 3 },
  progress: { marginHorizontal: 16, marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.lightGray, marginHorizontal: 16, borderRadius: 12, padding: 12, marginBottom: 12 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16, paddingTop: 0 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: COLORS.primary + '40', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, gap: 6, minWidth: 100 },
  btnText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  startBtn: { paddingVertical: 0, paddingHorizontal: 0, borderWidth: 0, minWidth: 150 },
  startGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, gap: 8, width: '100%' },
  startText: { fontSize: 13, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  historyBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  historyBadgeText: { fontSize: 11, fontWeight: '700' },
});
