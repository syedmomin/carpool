import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CURVE, EmptyState, AppBar, ProgressBar, RideCardSkeleton, RouteTag, Avatar, StarRating, TabPills } from '../../components';
import { useSocketData } from '../../context/SocketDataContext';
import { useGlobalModal } from '../../context/GlobalModalContext';
import { useToast } from '../../context/ToastContext';
import { ridesApi } from '../../services/api';

export default function ActiveRidesScreen({ navigation }) {
  const { showModal } = useGlobalModal();
  const { showToast } = useToast();
  const { myRides, myRidesState, loadMyRides, patchRide } = useSocketData();

  const [tab, setTab] = useState<'active' | 'upcoming' | 'completed'>('active');
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

  const activeRides = myRides.filter(r => r.status === 'IN_PROGRESS');
  const upcomingRides = myRides.filter(r => r.status === 'ACTIVE');
  const historyRides = myRides.filter(r => r.status === 'COMPLETED' || r.status === 'CANCELLED' || r.status === 'EXPIRED');

  const handleStartRide = (ride: any) => {
    if (!ride.vehicle) {
      showModal({
        type: 'danger', title: 'Vehicle Required',
        message: 'Register and activate a vehicle before starting a ride.',
        confirmText: 'Set Up Vehicle', cancelText: 'Cancel', icon: 'car-outline',
        onConfirm: () => navigation.navigate('MyVehiclesTab'),
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
    const confirmedBookings = (item.bookings || []).filter((b: any) => b.status === 'CONFIRMED' || b.status === 'COMPLETED');
    const confirmedSeats = confirmedBookings.reduce((s: number, b: any) => s + (b.seats || 1), 0);
    const firstPassenger = confirmedBookings[0]?.passenger;
    const available = item.totalSeats - item.bookedSeats;
    const fillPercent = confirmedSeats / item.totalSeats;
    const earned = confirmedSeats * item.pricePerSeat;
    const isActioning = actionLoading === item.id;
    const isActive = item.status === 'ACTIVE';
    const isInProgress = item.status === 'IN_PROGRESS';
    const isToday = item.date === todayStr;
    const hasAnyBooking = (item.bookings || []).length > 0;
    const isExpiredNoBook = isActive && !hasAnyBooking && item.date < todayStr;

    const statusLabel = isInProgress ? 'In Progress' :
      isExpiredNoBook ? 'Expired' :
        !hasAnyBooking ? 'No Requests Yet' :
          isToday ? 'Today' : available > 0 ? 'Scheduled' : 'Full';
    const statusColor = isInProgress ? COLORS.secondary : isExpiredNoBook ? COLORS.danger : isToday ? COLORS.primary : COLORS.textSecondary;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <RouteTag from={item.from} to={item.to} textStyle={styles.route} />
          <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        <View style={styles.dateRow}>
          <Text style={styles.date}>{item.date} • {item.departureTime}</Text>
          {!!item.roundTripGroupId && (
            <View style={styles.roundTripBadge}>
              <Ionicons name="swap-horizontal" size={11} color={COLORS.primary} />
              <Text style={styles.roundTripBadgeText}>Round Trip</Text>
            </View>
          )}
        </View>

        {firstPassenger ? (
          <View style={styles.passengerRow}>
            <Avatar name={firstPassenger.name} uri={firstPassenger.avatar} size={32} color={COLORS.primary} />
            <Text style={styles.passengerName} numberOfLines={1}>{firstPassenger.name}</Text>
            {firstPassenger.rating > 0 && <StarRating rating={firstPassenger.rating} size={12} />}
            {confirmedBookings.length > 1 && <Text style={styles.morePassengers}>+{confirmedBookings.length - 1} more</Text>}
          </View>
        ) : (
          <Text style={styles.noPassengersText}>No confirmed passengers yet</Text>
        )}

        <ProgressBar value={fillPercent} label={`Confirmed Seats: ${confirmedSeats}/${item.totalSeats}`}
          caption={`${Math.round(fillPercent * 100)}%`} style={styles.progress} />
        <View style={styles.statsRow}>
          <View style={styles.stat}><Ionicons name="people-outline" size={16} color={COLORS.primary} /><Text style={styles.statText}>{confirmedSeats} confirmed</Text></View>
          <View style={styles.stat}><Ionicons name="cash-outline" size={16} color={COLORS.secondary} /><Text style={styles.statText}>Rs {earned.toLocaleString()} earned</Text></View>
          <View style={styles.stat}><Ionicons name="car-outline" size={16} color={COLORS.textSecondary} /><Text style={styles.statText}>{vehicle?.type || 'Vehicle'}</Text></View>
        </View>
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.btn, styles.viewBtn, pressed && { opacity: 0.8 }]}
            onPress={() => navigation.navigate('RideBookings', { rideId: item.id })}
          >
            <Ionicons name="people-outline" size={15} color={COLORS.primary} />
            <Text style={styles.btnText} numberOfLines={1}>View {confirmedSeats}/{item.totalSeats}</Text>
          </Pressable>
          {isActive && (
            <Pressable
              style={({ pressed }) => [styles.btn, styles.cancelBtn, (isActioning || pressed) && { opacity: 0.6 }]}
              onPress={() => handleCancelRide(item)} disabled={isActioning}>
              <Text style={[styles.btnText, { color: COLORS.danger }]} numberOfLines={1}>Cancel</Text>
            </Pressable>
          )}
          {isActive && item.bookings?.some((b: any) => b.status === 'CONFIRMED') && isToday && (
            <Pressable
              style={({ pressed }) => [styles.btn, styles.startBtn, pressed && { opacity: 0.85 }]}
              onPress={() => handleStartRide(item)} disabled={isActioning}
            >
              {isActioning ? <ActivityIndicator size="small" color={COLORS.white} /> : (
                <>
                  <Ionicons name="play" size={14} color={COLORS.white} />
                  <Text style={styles.startText} numberOfLines={1}>Start Trip</Text>
                </>
              )}
            </Pressable>
          )}
          {isInProgress && (
            <Pressable
              style={({ pressed }) => [styles.btn, styles.trackBtn, pressed && { opacity: 0.85 }]}
              onPress={() => navigation.navigate('RideTracking', { rideId: item.id })}
            >
              <Ionicons name="navigate" size={14} color={COLORS.white} />
              <Text style={styles.trackBtnText} numberOfLines={1}>Open Tracking</Text>
            </Pressable>
          )}
        </View>
        {isActive && !isInProgress && !(item.bookings?.some((b: any) => b.status === 'CONFIRMED') && isToday) && (
          <View style={styles.startHint}>
            <Ionicons name="information-circle-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.startHintText}>
              {!isToday
                ? 'You can start this trip on its scheduled date.'
                : 'Confirm at least one passenger to start the trip.'}
            </Text>
          </View>
        )}
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
          <RouteTag from={item.from} to={item.to} textStyle={styles.route} />
          <Text style={[styles.statusLabel, { color: statusConfig.color }]}>{statusConfig.label}</Text>
        </View>
        <Text style={styles.date}>{item.date} • {item.departureTime}</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}><Ionicons name="people-outline" size={16} color={COLORS.primary} /><Text style={styles.statText}>{confirmedSeats} passengers</Text></View>
          <View style={styles.stat}><Ionicons name="cash-outline" size={16} color={COLORS.secondary} /><Text style={styles.statText}>Rs {earned.toLocaleString()}</Text></View>
          <View style={styles.stat}><Ionicons name="car-outline" size={16} color={COLORS.textSecondary} /><Text style={styles.statText}>{item.vehicle?.type || 'Vehicle'}</Text></View>
        </View>
        <Pressable style={styles.btn} onPress={() => navigation.navigate('RideBookings', { rideId: item.id })}>
          <Text style={styles.btnText}>View Passengers</Text>
        </Pressable>
      </View>
    );
  };

  const isInitialLoad = !myRidesState.loaded && myRidesState.loading;

  const addRideBtn = (
    <Pressable style={styles.addBtn} onPress={() => navigation.navigate('PostRide')}>
      <Ionicons name="add" size={18} color={COLORS.white} />
      <Text style={styles.addBtnText}>Add</Text>
    </Pressable>
  );

  if (isInitialLoad) {
    return (
      <View style={styles.container}>
        <AppBar title="My Rides" rightAction={addRideBtn} />
        <FlatList
          data={[1, 2, 3]}
          keyExtractor={item => item.toString()}
          contentContainerStyle={styles.list}
          renderItem={() => <RideCardSkeleton />}
        />
      </View>
    );
  }

  const data = tab === 'active' ? activeRides : tab === 'upcoming' ? upcomingRides : historyRides;
  const renderItem = tab === 'completed' ? renderHistoryRide : renderCurrentRide;

  return (
    <View style={styles.container}>
      <AppBar title="My Rides" rightAction={addRideBtn} />
      <TabPills
        tabs={[
          { label: `Active${activeRides.length > 0 ? ` (${activeRides.length})` : ''}`, value: 'active' },
          { label: `Upcoming${upcomingRides.length > 0 ? ` (${upcomingRides.length})` : ''}`, value: 'upcoming' },
          { label: 'Completed', value: 'completed' },
        ]}
        activeTab={tab}
        onSelect={setTab}
        style={{ marginHorizontal: 16, marginTop: 12, marginBottom: 4 }}
      />
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          !refreshing ? (
            (tab !== 'completed' && myRidesState.error)
              ? <EmptyState icon="car-sport-outline" title="Couldn't load your rides"
                subtitle="Please check your connection and try again."
                action={{ label: 'Try Again', onPress: () => loadMyRides(true) }} />
            : tab === 'active'
              ? <EmptyState icon="car-sport-outline" title="No Active Rides"
                subtitle="Rides you've started will appear here." />
            : tab === 'upcoming'
              ? <EmptyState icon="car-sport-outline" title="No Upcoming Rides"
                subtitle="You have no scheduled rides. Post a new ride to get started."
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
  loadingText: { fontSize: 14, color: COLORS.textSecondary },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, height: 38, borderRadius: 12, backgroundColor: COLORS.primary, ...CURVE },
  addBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  list: { padding: 16, paddingBottom: 32 },
  card: { backgroundColor: COLORS.cardBg, borderRadius: 16, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, ...CURVE },
  historyCard: { opacity: 0.9 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16 },
  route: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  statusLabel: { fontSize: 12, fontWeight: '700' },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 3 },
  date: { fontSize: 12, color: COLORS.textSecondary },
  roundTripBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primaryLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  roundTripBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.primary },

  passengerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 12 },
  passengerName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, flexShrink: 1 },
  morePassengers: { fontSize: 11, color: COLORS.textSecondary, marginLeft: 'auto' },
  noPassengersText: { fontSize: 12, color: COLORS.textSecondary, marginHorizontal: 16, marginTop: 12 },

  progress: { marginHorizontal: 16, marginBottom: 12, marginTop: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.lightGray, marginHorizontal: 16, borderRadius: 14, padding: 12, marginBottom: 12, ...CURVE },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary },
  actions: { flexDirection: 'row', gap: 8, padding: 16, paddingTop: 0 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, paddingVertical: 11, paddingHorizontal: 8, gap: 5, ...CURVE },
  btnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  viewBtn: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary + '30' },
  cancelBtn: { borderColor: COLORS.danger + '50' },
  startHint: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingBottom: 14, marginTop: -2 },
  startHintText: { fontSize: 11.5, color: COLORS.textSecondary, flex: 1, lineHeight: 16 },
  startBtn: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  startText: { fontSize: 13, fontWeight: '700', color: COLORS.white },
  trackBtn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  trackBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.white },
});
