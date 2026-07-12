import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, SectionHeader, NotifBadge, Avatar, PulseBadge, PressableScale, CURVE } from '../../components';
import { Skeleton, CardSkeleton, RideCardSkeleton } from '../../components/Skeleton';
import { useApp } from '../../context/AppContext';
import { useSocketData } from '../../context/SocketDataContext';
import { vehiclesApi } from '../../services/api';

import { formatLocalDate, getTodayStr } from '../../utils/date';
import { useDoubleBackExit } from '../../utils/useDoubleBackExit';

export default function DriverHomeScreen({ navigation }) {
  const { currentUser, unreadCount } = useApp();
  const { myRides, myRidesState, loadMyRides } = useSocketData();
  useDoubleBackExit();
  const [myVehicle, setMyVehicle] = useState(null);

  const [loadingVehicles, setLoadingVehicles] = useState(!myVehicle);

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
  }, [loadMyRides, myVehicle]));

  const todayStr = getTodayStr();
  const todayRides     = myRides.filter(r => r.date === todayStr);
  const activeRides    = myRides.filter(r => r.status === 'ACTIVE' || r.status === 'IN_PROGRESS');
  // Use the confirmed/completed booking seats when the full bookings array is
  // available (loaded via SocketDataContext), so pending-but-unaccepted seats
  // don't inflate the dashboard earnings number.
  const confirmedSeatsFor = (r: any) => {
    if (r.bookings) {
      return r.bookings
        .filter((b: any) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
        .reduce((sum: number, b: any) => sum + (b.seats || 1), 0);
    }
    return r.bookedSeats || 0;
  };
  const totalEarned    = todayRides.reduce((s, r) => s + confirmedSeatsFor(r) * (r.pricePerSeat || 0), 0);
  const totalPassengers= todayRides.reduce((s, r) => s + confirmedSeatsFor(r), 0);

  const QUICK_ACTIONS = [
    { icon: 'add-circle', label: 'Post Ride', gradient: GRADIENTS.primary, screen: 'PostRide', desc: 'Share your route' },
    { icon: 'car-sport', label: 'My Rides', gradient: GRADIENTS.teal, screen: 'MyRidesTab', desc: 'Manage bookings' },
    { icon: 'car', label: 'My Vehicles', gradient: GRADIENTS.primary, screen: 'MyVehiclesTab', desc: 'Vehicle details' },
    { icon: 'list', label: 'Ride Requests', gradient: GRADIENTS.secondary, screen: 'DriverRequestsTab', desc: 'Make offers on requests' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={GRADIENTS.teal as any} style={styles.header}>
        <View style={styles.bgCircle} />
        <View style={styles.bgCircle2} />

        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Avatar name={currentUser?.name} uri={currentUser?.avatar} size={52} color="rgba(255,255,255,0.3)" />
            <View style={styles.headerInfo}>
              <Text style={styles.greeting}>Good day,</Text>
              <Text style={styles.userName}>{currentUser?.name}</Text>
            </View>
          </View>
          <Pressable style={styles.notifBtn} onPress={() => navigation.navigate('Notifications')}>
            <View style={styles.notifIcon}>
              <Ionicons name={unreadCount > 0 ? 'notifications' : 'notifications-outline'} size={23} color={COLORS.primary} />
              <PulseBadge count={unreadCount} />
            </View>
          </Pressable>
        </View>

        {/* Stats — hero earnings + two supporting metrics */}
        <View style={styles.statsWrap}>
          <PressableScale
            style={styles.heroCard}
            onPress={() => navigation.navigate('Earnings')}
            scaleTo={0.97}
          >
            <View style={styles.heroIconChip}>
              <Ionicons name="wallet" size={24} color={COLORS.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroLabel}>Today's Earnings</Text>
              <Text style={styles.heroVal}>Rs {totalEarned > 0 ? totalEarned.toLocaleString() : '0'}</Text>
            </View>
            <View style={styles.heroArrow}>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </View>
          </PressableScale>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconChip}>
                <Ionicons name="car-sport-outline" size={20} color="#fff" />
              </View>
              <View>
                <Text style={styles.statVal}>{todayRides.length}</Text>
                <Text style={styles.statLabel}>Today's Rides</Text>
              </View>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIconChip}>
                <Ionicons name="people-outline" size={20} color="#fff" />
              </View>
              <View>
                <Text style={styles.statVal}>{totalPassengers}</Text>
                <Text style={styles.statLabel}>Passengers</Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action, i) => (
            <PressableScale key={i} style={styles.actionCard} onPress={() => navigation.navigate(action.screen)} scaleTo={0.96} index={i}>
              <LinearGradient colors={action.gradient as any} style={styles.actionGrad}>
                <View style={styles.actionIconBox}>
                  <Ionicons name={action.icon as any} size={26} color="#fff" />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
                <Text style={styles.actionDesc}>{action.desc}</Text>
                <View style={styles.actionArrow}>
                  <Ionicons name="arrow-forward" size={13} color="rgba(255,255,255,0.8)" />
                </View>
              </LinearGradient>
            </PressableScale>
          ))}
        </View>

        {/* Active Vehicle */}
        <SectionHeader title="Active Vehicle" onSeeAll={() => navigation.navigate('MyVehiclesTab')} />
        {loadingVehicles ? (
           <Skeleton width="100%" height={80} borderRadius={16} style={{ marginBottom: 24 }} />
        ) : myVehicle ? (
          <PressableScale style={styles.vehicleCard} onPress={() => navigation.navigate('MyVehiclesTab')} scaleTo={0.98}>
            <View style={styles.vehicleInner}>
              <View style={styles.vehicleAccentBar} />
              <View style={styles.vehicleIconBox}>
                <Ionicons name="car-sport" size={28} color={COLORS.primary} />
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
                    <Text style={styles.rideRoute}>{ride.from} → {ride.to}</Text>
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

        {/* Tip */}
        <LinearGradient colors={['#fff8e1', '#fff3cd']} style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={22} color={COLORS.accent} />
          <Text style={styles.tipText}>Uploading clear vehicle photos can increase your bookings by 40%!</Text>
        </LinearGradient>

        <View style={{ height: 24 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: Platform.OS === 'ios' ? 55 : 45, paddingBottom: 28, paddingHorizontal: 20, position: 'relative', overflow: 'hidden' },
  bgCircle: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.06)', top: -70, right: -50 },
  bgCircle2: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -40, left: -30 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerInfo: {},
  greeting: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  userName: { fontSize: 18, fontWeight: '800', color: '#fff' },
  notifBtn: {},
  notifIcon: { width: 44, height: 44, backgroundColor: '#fff', borderRadius: 14, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  notifDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.danger },
  notifDotText: { fontSize: 8, color: '#fff', fontWeight: '700' },
  statsWrap: { gap: 12 },
  heroCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: 20, padding: 16, ...CURVE,
  },
  heroIconChip: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center' },
  heroLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.9)', marginBottom: 3 },
  heroVal: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: 0.3 },
  heroArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: 16, padding: 14,
  },
  statIconChip: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.28)', alignItems: 'center', justifyContent: 'center' },
  statVal: { fontSize: 20, fontWeight: '900', color: '#fff' },
  statLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  body: { padding: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 14 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  actionCard: { width: '47%', aspectRatio: 1.05, borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 5, ...CURVE },
  actionGrad: { flex: 1, padding: 16, justifyContent: 'flex-start' },
  actionIconBox: { width: 52, height: 52, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 14, fontWeight: '800', color: '#fff' },
  actionDesc: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  actionArrow: { position: 'absolute', top: 14, right: 14, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  vehicleCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: COLORS.border, ...CURVE },
  vehicleInner: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  vehicleAccentBar: { width: 4, borderRadius: 2, height: '80%', backgroundColor: COLORS.primary, marginRight: 0 },
  vehicleIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  vehicleInfo: { flex: 1 },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  vehicleName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  activePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, gap: 4 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.secondary },
  activeText: { fontSize: 11, color: COLORS.secondary, fontWeight: '700' },
  vehicleType: { fontSize: 12, color: COLORS.gray, marginBottom: 6 },
  plateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  plateBadge: { fontSize: 11, fontWeight: '700', color: COLORS.textPrimary, backgroundColor: 'rgba(26,115,232,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  seatsText: { fontSize: 11, color: COLORS.gray },
  featureTag: { fontSize: 11, color: COLORS.teal, fontWeight: '700', backgroundColor: 'rgba(0,137,123,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  addVehicleCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24, borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed' },
  addVehicleTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginTop: 10, marginBottom: 4 },
  addVehicleSub: { fontSize: 12, color: COLORS.gray, textAlign: 'center', lineHeight: 18 },
  rideCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  rideLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rideDot: { width: 10, height: 10, borderRadius: 5 },
  rideRoute: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  rideDate: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  rideRight: { alignItems: 'flex-end' },
  rideEarned: { fontSize: 14, fontWeight: '800', color: COLORS.secondary },
  rideSeats: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  tipCard: { borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  tipText: { flex: 1, fontSize: 13, color: COLORS.textPrimary, lineHeight: 20 },
});
