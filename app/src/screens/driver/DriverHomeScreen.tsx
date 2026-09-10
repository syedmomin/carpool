import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SectionHeader, PulseBadge, PressableScale, CURVE, RouteTag, VehicleTypeImage } from '../../components';
import { Skeleton, RideCardSkeleton } from '../../components/Skeleton';
import { useApp } from '../../context/AppContext';
import { useSocketData } from '../../context/SocketDataContext';
import { vehiclesApi, reviewsApi } from '../../services/api';

import { formatLocalDate, getTodayStr } from '../../utils/date';
import { useDoubleBackExit } from '../../utils/useDoubleBackExit';

// Compute confirmed seats from bookings array when the full bookings list is
// available (loaded via SocketDataContext), so pending-but-unaccepted seats
// don't inflate the dashboard earnings number.
function confirmedSeatsFor(r: any): number {
  if (r.bookings) {
    return r.bookings
      .filter((b: any) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
      .reduce((sum: number, b: any) => sum + (b.seats || 1), 0);
  }
  return r.bookedSeats || 0;
}

export default function DriverHomeScreen({ navigation }) {
  const { currentUser, unreadCount } = useApp();
  const { myRides, myRidesState, loadMyRides } = useSocketData();
  const insets = useSafeAreaInsets();
  useDoubleBackExit();
  const [myVehicle, setMyVehicle] = useState(null);
  const [loadingVehicles, setLoadingVehicles] = useState(!myVehicle);
  const [rating, setRating] = useState<number | null>(null);

  useFocusEffect(useCallback(() => {
    loadMyRides();
    if (!myVehicle) {
      setLoadingVehicles(true);
      vehiclesApi.myVehicles().then(({ data }) => {
        if (data?.data) {
          const active = data.data.find((v: any) => v.isActive) || data.data[0] || null;
          setMyVehicle(active);
        }
        setLoadingVehicles(false);
      }).catch(() => setLoadingVehicles(false));
    }
    if (currentUser?.id) {
      reviewsApi.forUser(currentUser.id).then(({ data }) => {
        const stats = data?.data?.stats;
        setRating(stats?.total ? stats.averageRating : (currentUser?.rating ?? null));
      }).catch(() => {});
    }
  }, [loadMyRides, myVehicle, currentUser?.id]));

  const todayStr = getTodayStr();
  const yesterdayStr = formatLocalDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const todayRides     = myRides.filter(r => r.date === todayStr);
  const yesterdayRides = myRides.filter(r => r.date === yesterdayStr);
  const inProgressRide = myRides.find(r => r.status === 'IN_PROGRESS');

  const totalEarned     = todayRides.reduce((s, r) => s + confirmedSeatsFor(r) * (r.pricePerSeat || 0), 0);
  const yesterdayEarned  = yesterdayRides.reduce((s, r) => s + confirmedSeatsFor(r) * (r.pricePerSeat || 0), 0);
  const totalPassengers = todayRides.reduce((s, r) => s + confirmedSeatsFor(r), 0);

  // Percentage change vs. yesterday. When there's no baseline, fall back to
  // a flat 0% instead of a misleading divide-by-zero spike.
  const earningsDeltaPct = yesterdayEarned > 0
    ? Math.round(((totalEarned - yesterdayEarned) / yesterdayEarned) * 100)
    : (totalEarned > 0 ? 100 : 0);

  const QUICK_ACTIONS = [
    { icon: 'add-circle', label: 'Post Ride', screen: 'PostRide' },
    { icon: 'list', label: 'Requests', screen: 'DriverRequestsTab' },
    { icon: 'car-sport', label: 'My Rides', screen: 'MyRidesTab' },
    { icon: 'wallet', label: 'Earnings', screen: 'Earnings' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerInfo}>
            <Text style={styles.greeting}>Hi, {currentUser?.name} 👋</Text>
            <Text style={styles.subGreeting}>Ready for your next ride?</Text>
          </View>
          <Pressable style={styles.notifBtn} onPress={() => navigation.navigate('DriverHomeTab', { screen: 'Notifications' })}>
            <View style={styles.notifIcon}>
              <Ionicons name={unreadCount > 0 ? 'notifications' : 'notifications-outline'} size={21} color="#fff" />
              <PulseBadge count={unreadCount} />
            </View>
          </Pressable>
        </View>

      </View>

      {/* Active ride indicator — shown while a trip is in progress and the
          driver has minimized the tracking screen to do other work. */}
      {inProgressRide && (
        <PressableScale
          style={{ marginHorizontal: 20, marginTop: 4 }}
          onPress={() => navigation.navigate('RideTracking', { rideId: inProgressRide.id })}
          scaleTo={0.98}
        >
          <LinearGradient colors={GRADIENTS.primary as any} style={styles.activeRideBanner}>
            <View style={styles.activeRideDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.activeRideTitle}>Trip in progress</Text>
              <RouteTag
                from={inProgressRide.from}
                to={inProgressRide.to}
                textStyle={styles.activeRideRoute}
                arrowColor="rgba(255,255,255,0.7)"
              />
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.white} />
          </LinearGradient>
        </PressableScale>
      )}

      {/* Earnings hero + stats */}
      <View style={styles.statsWrap}>
        <PressableScale onPress={() => navigation.navigate('Earnings')} scaleTo={0.97}>
          <LinearGradient colors={GRADIENTS.primary as any} style={styles.heroCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroLabel}>Today's Earnings</Text>
              <Text style={styles.heroVal}>Rs. {totalEarned > 0 ? totalEarned.toLocaleString() : '0'}</Text>
              <View style={styles.deltaRow}>
                <Ionicons name={earningsDeltaPct >= 0 ? 'arrow-up' : 'arrow-down'} size={12} color={COLORS.white} />
                <Text style={styles.deltaText}>{Math.abs(earningsDeltaPct)}% vs yesterday</Text>
              </View>
            </View>
            <View style={styles.heroIconChip}>
              <Ionicons name="wallet" size={24} color={COLORS.white} />
            </View>
          </LinearGradient>
        </PressableScale>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{todayRides.length}</Text>
            <Text style={styles.statLabel}>Rides</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{totalPassengers}</Text>
            <Text style={styles.statLabel}>Passengers</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{rating != null ? rating.toFixed(1) : '--'}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        {/* Quick Actions */}
        <SectionHeader title="Quick Actions" />
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action, i) => (
            <PressableScale key={i} style={styles.actionCard} onPress={() => navigation.navigate(action.screen)} scaleTo={0.94} index={i}>
              <View style={styles.actionIconBox}>
                <Ionicons name={action.icon as any} size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </PressableScale>
          ))}
        </View>

        {/* Today's Requests */}
        <SectionHeader title="Today's Requests" onSeeAll={() => navigation.navigate('MyRidesTab')} />
        {(myRidesState.loading && !myRidesState.loaded) ? (
          <>
            <RideCardSkeleton />
            <RideCardSkeleton />
          </>
        ) : todayRides.length > 0 ? (
          todayRides.slice(0, 4).map(ride => (
            <PressableScale key={ride.id} style={styles.rideCard} onPress={() => navigation.navigate('MyRidesTab')} scaleTo={0.98}>
              <View style={styles.rideLeft}>
                <View style={[styles.rideDot, { backgroundColor: confirmedSeatsFor(ride) < ride.totalSeats ? COLORS.secondary : COLORS.accent }]} />
                <View>
                  <RouteTag from={ride.from} to={ride.to} textStyle={styles.rideRoute} />
                  <Text style={styles.rideDate}>{confirmedSeatsFor(ride)}/{ride.totalSeats} seats booked</Text>
                </View>
              </View>
              <View style={styles.rideRight}>
                <Text style={styles.rideEarned}>Rs {(confirmedSeatsFor(ride) * ride.pricePerSeat).toLocaleString()}</Text>
                <Text style={styles.rideSeats}>{ride.departureTime}</Text>
              </View>
            </PressableScale>
          ))
        ) : (
          <View style={styles.emptyRow}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.textSecondary} />
            <Text style={styles.emptyRowText}>No requests scheduled for today.</Text>
          </View>
        )}

        {/* Active Vehicle */}
        <SectionHeader title="Active Vehicle" onSeeAll={() => navigation.navigate('MyVehiclesTab')} style={{ marginTop: 8 }} />
        {loadingVehicles ? (
           <Skeleton width="100%" height={80} borderRadius={16} style={{ marginBottom: 24 }} />
        ) : myVehicle ? (
          <PressableScale style={styles.vehicleCard} onPress={() => navigation.navigate('MyVehiclesTab')} scaleTo={0.98}>
            <View style={styles.vehicleInner}>
              <View style={styles.vehicleAccentBar} />
              <View style={styles.vehicleIconBox}>
                <VehicleTypeImage type={myVehicle.type} size={42} />
              </View>
              <View style={styles.vehicleInfo}>
                <View style={styles.vehicleRow}>
                  <Text style={styles.vehicleName}>{myVehicle.brand}</Text>
                  <View style={styles.activePill}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeText}>Active</Text>
                  </View>
                </View>
                <Text style={styles.vehicleType}>{myVehicle.type} • {myVehicle.color}</Text>
                <View style={styles.plateRow}>
                  <Text style={styles.plateBadge}>{myVehicle.plateNumber}</Text>
                  <Text style={styles.seatsText}>{myVehicle.totalSeats} seats</Text>
                  {myVehicle.ac && <Text style={styles.featureTag}>AC</Text>}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
            </View>
          </PressableScale>
        ) : (
          <PressableScale style={styles.addVehicleCard} onPress={() => navigation.navigate('MyVehiclesTab')} scaleTo={0.98}>
            <Ionicons name="add-circle-outline" size={36} color={COLORS.primary} />
            <Text style={styles.addVehicleTitle}>Add Your Vehicle</Text>
            <Text style={styles.addVehicleSub}>Register your car, bus, or coaster to start posting rides</Text>
          </PressableScale>
        )}

        {/* Recent Rides */}
        {(myRidesState.loading && !myRidesState.loaded) ? (
          <>
            <SectionHeader title="Recent Rides" />
            <RideCardSkeleton />
            <RideCardSkeleton />
          </>
        ) : myRides.length > 0 && (
          <>
            <SectionHeader title="Recent Rides" onSeeAll={() => navigation.navigate('MyRidesTab')} />
            {myRides.slice(0, 2).map(ride => (
              <View key={ride.id} style={styles.rideCard}>
                <View style={styles.rideLeft}>
                  <View style={[styles.rideDot, { backgroundColor: ride.bookedSeats < ride.totalSeats ? COLORS.secondary : COLORS.accent }]} />
                  <View>
                    <RouteTag from={ride.from} to={ride.to} textStyle={styles.rideRoute} />
                    <Text style={styles.rideDate}>{ride.date} • {ride.departureTime}</Text>
                  </View>
                </View>
                <View style={styles.rideRight}>
                  <Text style={styles.rideEarned}>Rs {(ride.bookedSeats * ride.pricePerSeat).toLocaleString()}</Text>
                  <Text style={styles.rideSeats}>{ride.bookedSeats}/{ride.totalSeats} seats</Text>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 24 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { backgroundColor: COLORS.bg, paddingBottom: 16, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  headerInfo: { flex: 1 },
  greeting: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  subGreeting: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  notifBtn: { position: 'relative', marginTop: 2 },
  notifIcon: { width: 44, height: 44, backgroundColor: COLORS.primary, borderRadius: 22, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  activeRideBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, padding: 14, ...CURVE,
  },
  activeRideDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e' },
  activeRideTitle: { fontSize: 13, fontWeight: '700', color: COLORS.white, marginBottom: 2 },
  activeRideRoute: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  statsWrap: { gap: 12, paddingHorizontal: 20, paddingTop: 16 },
  heroCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, padding: 18, ...CURVE,
  },
  heroIconChip: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  heroLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.9)', marginBottom: 4 },
  heroVal: { fontSize: 26, fontWeight: '700', color: COLORS.white },
  deltaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  deltaText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.95)' },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, alignItems: 'center',
    backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, paddingVertical: 12,
  },
  statVal: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  statLabel: { fontSize: 10, fontWeight: '600', color: COLORS.textSecondary, marginTop: 2 },
  body: { padding: 20 },
  actionsGrid: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  actionCard: { flex: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border, ...CURVE },
  actionIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  actionLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
  vehicleCard: { backgroundColor: COLORS.cardBg, borderRadius: 16, overflow: 'hidden', marginBottom: 24, borderWidth: 1, borderColor: COLORS.border, ...CURVE },
  vehicleInner: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  vehicleAccentBar: { width: 4, borderRadius: 2, height: '80%', backgroundColor: COLORS.primary, marginRight: 0 },
  vehicleIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  vehicleInfo: { flex: 1 },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  vehicleName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  activePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, gap: 4 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.secondary },
  activeText: { fontSize: 11, color: COLORS.secondary, fontWeight: '700' },
  vehicleType: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 6 },
  plateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  plateBadge: { fontSize: 11, fontWeight: '700', color: COLORS.textPrimary, backgroundColor: COLORS.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  seatsText: { fontSize: 11, color: COLORS.textSecondary },
  featureTag: { fontSize: 11, color: COLORS.primary, fontWeight: '700', backgroundColor: COLORS.primaryLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  addVehicleCard: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24, borderWidth: 1.5, borderColor: COLORS.border, borderStyle: 'dashed' },
  addVehicleTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginTop: 10, marginBottom: 4 },
  addVehicleSub: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 18 },
  rideCard: { backgroundColor: COLORS.cardBg, borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: COLORS.border },
  rideLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rideDot: { width: 10, height: 10, borderRadius: 5 },
  rideRoute: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  rideDate: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  rideRight: { alignItems: 'flex-end' },
  rideEarned: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  rideSeats: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.cardBg, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  emptyRowText: { fontSize: 12, color: COLORS.textSecondary, flex: 1 },
});
