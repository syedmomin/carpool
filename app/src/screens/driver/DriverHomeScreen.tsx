import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, SectionHeader, NotifBadge, Avatar } from '../../components';
import { useApp } from '../../context/AppContext';
import { useSocketData } from '../../context/SocketDataContext';
import { vehiclesApi } from '../../services/api';

export default function DriverHomeScreen({ navigation }) {
  const { currentUser, unreadCount } = useApp();
  const { myRides, myRidesState, loadMyRides } = useSocketData();
  const [myVehicle, setMyVehicle] = useState(null);

  useFocusEffect(useCallback(() => {
    if (!myRidesState.loaded) loadMyRides();
    vehiclesApi.myVehicles().then(({ data }) => {
      if (data?.data) {
        const active = data.data.find((v: any) => v.isActive) || data.data[0] || null;
        setMyVehicle(active);
      }
    });
  }, [myRidesState.loaded]));

  const activeRides    = myRides.filter(r => r.status === 'ACTIVE' || r.status === 'IN_PROGRESS');
  const totalEarned    = myRides.reduce((s, r) => s + (r.bookedSeats * r.pricePerSeat || 0), 0);
  const totalPassengers= myRides.reduce((s, r) => s + (r.bookedSeats || 0), 0);

  const QUICK_ACTIONS = [
    { icon: 'add-circle', label: 'Post Ride', gradient: GRADIENTS.primary, screen: 'PostRide', desc: 'Share your route' },
    { icon: 'car-sport', label: 'My Rides', gradient: GRADIENTS.teal, screen: 'MyRidesTab', desc: 'Manage bookings' },
    { icon: 'car', label: 'My Vehicles', gradient: GRADIENTS.primary, screen: 'MyVehicles', desc: 'Vehicle details' },
    { icon: 'wallet', label: 'Earnings', gradient: GRADIENTS.secondary, screen: 'Earnings', desc: 'View income' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={GRADIENTS.teal as any} style={styles.header}>
        <View style={styles.bgCircle} />
        <View style={styles.bgCircle2} />

        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Avatar name={currentUser?.name} size={52} color="rgba(255,255,255,0.3)" />
            <View style={styles.headerInfo}>
              <Text style={styles.greeting}>Good day,</Text>
              <Text style={styles.userName}>{currentUser?.name}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notifBtn} onPress={() => navigation.navigate('Notifications')}>
            <View style={styles.notifIcon}>
              <Ionicons name="notifications-outline" size={22} color={COLORS.teal} />
              {unreadCount > 0 && (
                <View style={styles.notifDot}>
                  <Text style={styles.notifDotText}>{unreadCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {[
            { icon: 'car-sport-outline', value: activeRides.length, label: 'Active Rides' },
            { icon: 'people-outline', value: totalPassengers, label: 'Passengers' },
            { icon: 'wallet-outline', value: `Rs ${totalEarned > 0 ? (totalEarned / 1000).toFixed(1) + 'k' : '0'}`, label: 'Total Earned', accent: true },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Ionicons name={(s.icon) as any} size={18} color={s.accent ? COLORS.accent : 'rgba(255,255,255,0.9)'} />
              <Text style={[styles.statVal, s.accent && { color: COLORS.accent }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action, i) => (
            <TouchableOpacity key={i} style={styles.actionCard} onPress={() => navigation.navigate(action.screen)} activeOpacity={0.88}>
              <LinearGradient colors={action.gradient as any} style={styles.actionGrad}>
                <View style={styles.actionIconBox}>
                  <Ionicons name={(action.icon) as any} size={28} color="#fff" />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
                <Text style={styles.actionDesc}>{action.desc}</Text>
                <View style={styles.actionArrow}>
                  <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.8)" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Active Vehicle */}
        <SectionHeader title="Active Vehicle" onSeeAll={() => navigation.navigate('MyVehicles')} />
        {myVehicle ? (
          <TouchableOpacity style={styles.vehicleCard} onPress={() => navigation.navigate('MyVehicles')}>
            <View style={styles.vehicleInner}>
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
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.addVehicleCard} onPress={() => navigation.navigate('MyVehicles')}>
            <Ionicons name="add-circle-outline" size={36} color={COLORS.primary} />
            <Text style={styles.addVehicleTitle}>Add Your Vehicle</Text>
            <Text style={styles.addVehicleSub}>Register your car, bus, or coaster to start posting rides</Text>
          </TouchableOpacity>
        )}

        {/* Recent Rides */}
        {myRides.length > 0 && (
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
  statsGrid: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: 14, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 18, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },
  body: { padding: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 14 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  actionCard: { width: '47%', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5 },
  actionGrad: { padding: 18, minHeight: 130, justifyContent: 'space-between' },
  actionIconBox: { width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 14, fontWeight: '800', color: '#fff' },
  actionDesc: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  actionArrow: { alignSelf: 'flex-end', width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  vehicleCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: COLORS.border },
  vehicleInner: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
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
