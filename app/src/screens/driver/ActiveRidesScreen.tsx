import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CURVE, EmptyState, AppBar, ProgressBar, RideCardSkeleton, RouteTag, Avatar, StarRating, TabPills, RideBookingsSheet } from '../../components';
import { useSocketData } from '../../context/SocketDataContext';
import { useGlobalModal } from '../../context/GlobalModalContext';
import { useToast } from '../../context/ToastContext';
import { ridesApi } from '../../services/api';

export default function ActiveRidesScreen({ navigation }) {
  const { showModal } = useGlobalModal();
  const { showToast } = useToast();
  const { myRides, myRidesState, loadMyRides, patchRide } = useSocketData();

  const [tab, setTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bookingsSheet, setBookingsSheet] = useState<{ rideId: string; tab: 'pending' | 'accepted' } | null>(null);

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

  // In-progress rides surface inside the Upcoming tab (at the top, via
  // sort below) rather than their own tab — a driver only ever has one
  // ride running at a time, so a dedicated tab for it was dead weight.
  const upcomingRides = myRides
    .filter(r => r.status === 'ACTIVE' || r.status === 'IN_PROGRESS')
    .sort((a, b) => (a.status === b.status ? 0 : a.status === 'IN_PROGRESS' ? -1 : 1));
  const historyRides = myRides.filter(r => r.status === 'COMPLETED' || r.status === 'CANCELLED' || r.status === 'EXPIRED');

  const bookingsSheetRide = myRides.find(r => r.id === bookingsSheet?.rideId) || null;

  const handleStartRide = (ride: any) => {
    if (!ride.vehicle) {
      showModal({
        type: 'danger', title: 'Vehicle Required',
        message: "You'll need an active vehicle before you can start a ride.",
        confirmText: 'Set Up Vehicle', cancelText: 'Cancel', icon: 'car-outline',
        onConfirm: () => navigation.navigate('MyVehiclesTab'),
      });
      return;
    }
    showModal({
      type: 'primary', title: 'Start Ride?',
      message: "Passengers will get a notification once you start the trip.",
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
      message: 'This cancels the ride and lets every passenger know.',
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

  const renderRide = ({ item }: any) => {
    const confirmedBookings = (item.bookings || []).filter((b: any) => b.status === 'CONFIRMED' || b.status === 'COMPLETED');
    const pendingBookings = (item.bookings || []).filter((b: any) => b.status === 'PENDING');
    const confirmedSeats = confirmedBookings.reduce((s: number, b: any) => s + (b.seats || 1), 0);
    const firstPassenger = confirmedBookings[0]?.passenger;
    const fillPercent = confirmedSeats / item.totalSeats;
    const earned = confirmedSeats * item.pricePerSeat;
    const isActioning = actionLoading === item.id;
    const isActive = item.status === 'ACTIVE';
    const isInProgress = item.status === 'IN_PROGRESS';
    const isFinished = item.status === 'COMPLETED' || item.status === 'CANCELLED' || item.status === 'EXPIRED';
    const isToday = item.date === todayStr;
    const hasAnyBooking = (item.bookings || []).length > 0;
    const isExpiredNoBook = isActive && !hasAnyBooking && item.date < todayStr;
    const available = item.totalSeats - item.bookedSeats;
    const isExpanded = expandedId === item.id;

    const historyLabel: Record<string, string> = { COMPLETED: 'Completed', CANCELLED: 'Cancelled', EXPIRED: 'Expired' };
    const statusLabel = isInProgress ? 'In Progress' :
      isExpiredNoBook ? 'Expired' :
      isFinished ? (historyLabel[item.status] || item.status) :
      !hasAnyBooking ? 'No Requests Yet' :
      isToday ? 'Today' : available > 0 ? 'Scheduled' : 'Full';
    const statusColor = isInProgress ? COLORS.secondary
      : (item.status === 'CANCELLED' || isExpiredNoBook) ? COLORS.danger
      : isFinished ? COLORS.textSecondary
      : isToday ? COLORS.primary : COLORS.textSecondary;

    const canStart = isActive && confirmedBookings.length > 0 && isToday;

    return (
      <Pressable style={styles.rideRow} onPress={() => setExpandedId(isExpanded ? null : item.id)}>
        <View style={styles.rowTop}>
          <RouteTag from={item.from} to={item.to} textStyle={styles.route} style={{ flex: 1 }} />
          <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Ionicons name="calendar-outline" size={12} color={COLORS.gray} />
            <Text style={styles.metaText}>{item.date}</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="time-outline" size={12} color={COLORS.gray} />
            <Text style={styles.metaText}>{item.departureTime}</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="people-outline" size={12} color={COLORS.gray} />
            <Text style={styles.metaText}>{confirmedSeats}/{item.totalSeats}</Text>
          </View>
        </View>

        {pendingBookings.length > 0 && !isFinished && (
          <Pressable
            style={styles.pendingChip}
            onPress={(e) => { e.stopPropagation(); setBookingsSheet({ rideId: item.id, tab: 'pending' }); }}
          >
            <Ionicons name="hourglass-outline" size={13} color={COLORS.warning} />
            <Text style={styles.pendingChipText}>
              {pendingBookings.length} new request{pendingBookings.length !== 1 ? 's' : ''}
            </Text>
            <Ionicons name="chevron-forward" size={13} color={COLORS.warning} />
          </Pressable>
        )}

        <View style={styles.bottomRow}>
          <Text style={styles.amount}>Rs {earned.toLocaleString()}</Text>
          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.gray} />
        </View>

        {isExpanded && (
          <View style={styles.expandedSection}>
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

            {!isFinished && (
              <ProgressBar value={fillPercent} label={`Confirmed Seats: ${confirmedSeats}/${item.totalSeats}`}
                caption={`${Math.round(fillPercent * 100)}%`} style={styles.progress} />
            )}

            <View style={styles.expandedActionsRow}>
              <Pressable
                style={({ pressed }) => [styles.btn, styles.viewBtn, pressed && { opacity: 0.8 }]}
                onPress={(e) => { e.stopPropagation(); setBookingsSheet({ rideId: item.id, tab: 'accepted' }); }}
              >
                <Ionicons name="people-outline" size={15} color={COLORS.primary} />
                <Text style={styles.btnText} numberOfLines={1}>View {confirmedSeats}/{item.totalSeats}</Text>
              </Pressable>
              {isActive && (
                <Pressable
                  style={({ pressed }) => [styles.btn, styles.cancelBtn, (isActioning || pressed) && { opacity: 0.6 }]}
                  onPress={(e) => { e.stopPropagation(); handleCancelRide(item); }} disabled={isActioning}>
                  <Text style={[styles.btnText, { color: COLORS.danger }]} numberOfLines={1}>Cancel</Text>
                </Pressable>
              )}
              {canStart && (
                <Pressable
                  style={({ pressed }) => [styles.btn, styles.startBtn, pressed && { opacity: 0.85 }]}
                  onPress={(e) => { e.stopPropagation(); handleStartRide(item); }} disabled={isActioning}
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
                  onPress={(e) => { e.stopPropagation(); navigation.navigate('RideTracking', { rideId: item.id }); }}
                >
                  <Ionicons name="navigate" size={14} color={COLORS.white} />
                  <Text style={styles.trackBtnText} numberOfLines={1}>Open Tracking</Text>
                </Pressable>
              )}
            </View>
            {isActive && !isInProgress && !canStart && (
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
        )}
      </Pressable>
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

  const data = tab === 'upcoming' ? upcomingRides : historyRides;

  return (
    <View style={styles.container}>
      <AppBar title="My Rides" rightAction={addRideBtn} />
      <TabPills
        tabs={[
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
        renderItem={renderRide}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          !refreshing ? (
            (tab !== 'completed' && myRidesState.error)
              ? <EmptyState icon="car-sport-outline" title="Couldn't Load Your Rides"
                subtitle="Check your internet and try again."
                action={{ label: 'Try Again', onPress: () => loadMyRides(true) }} />
            : tab === 'upcoming'
              ? <EmptyState icon="car-sport-outline" title="No Upcoming Rides"
                subtitle="Post a ride and it'll show up here."
                action={{ label: 'Post a Ride', onPress: () => navigation.navigate('PostRide') }} />
              : <EmptyState icon="time-outline" title="No Ride History"
                subtitle="Completed and cancelled rides will appear here." />
          ) : null
        }
      />

      <RideBookingsSheet
        visible={!!bookingsSheet}
        ride={bookingsSheetRide}
        initialTab={bookingsSheet?.tab}
        onClose={() => setBookingsSheet(null)}
        onOpenBooking={(booking) => navigation.navigate('DriverBookingDetail', { booking })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, height: 38, borderRadius: 12, backgroundColor: COLORS.primary, ...CURVE },
  addBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  list: { padding: 16, paddingBottom: 32 },

  rideRow: { backgroundColor: COLORS.cardBg, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, padding: 14, marginBottom: 10, ...CURVE },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 },
  route: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  statusLabel: { fontSize: 12, fontWeight: '700' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.lightGray, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  metaText: { fontSize: 11, fontWeight: '600', color: COLORS.gray },

  pendingChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.warningLight, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 10 },
  pendingChipText: { flex: 1, fontSize: 12.5, fontWeight: '700', color: '#92400e' },

  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 },
  amount: { fontSize: 15, fontWeight: '700', color: COLORS.primary },

  expandedSection: { marginTop: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  passengerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  passengerName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, flexShrink: 1 },
  morePassengers: { fontSize: 11, color: COLORS.textSecondary, marginLeft: 'auto' },
  noPassengersText: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 12 },
  progress: { marginBottom: 12 },
  expandedActionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 10, paddingVertical: 11, paddingHorizontal: 8, gap: 5, ...CURVE },
  btnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  viewBtn: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary + '30' },
  cancelBtn: { borderColor: COLORS.danger + '50' },
  startBtn: { backgroundColor: COLORS.secondary, borderColor: COLORS.secondary },
  startText: { fontSize: 13, fontWeight: '700', color: COLORS.white },
  trackBtn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  trackBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.white },
  startHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  startHintText: { fontSize: 11.5, color: COLORS.textSecondary, flex: 1, lineHeight: 16 },
});
