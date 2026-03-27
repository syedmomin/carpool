import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, SectionHeader, NotifBadge } from '../../components';
import MapBackground from '../../components/MapBackground';
import { useApp } from '../../context/AppContext';

const NEARBY_MARKERS = [
  { id: 1, latitude: 24.8700, longitude: 67.0300 },
  { id: 2, latitude: 24.8500, longitude: 67.0600 },
  { id: 3, latitude: 24.8900, longitude: 66.9800 },
];

export default function DriverHomeScreen({ navigation }) {
  const { currentUser, getMyRides, getVehicleByDriver, unreadCount } = useApp();
  const myRides = getMyRides();
  const myVehicle = getVehicleByDriver(currentUser?.id);
  const activeRides = myRides.filter(r => r.status === 'active');
  const totalEarned = myRides.reduce((sum, r) => sum + (r.bookedSeats * r.pricePerSeat), 0);

  return (
    <View style={styles.container}>
      {/* ── Map Header ── */}
      <View style={styles.mapSection}>
        <MapBackground markers={NEARBY_MARKERS} style={StyleSheet.absoluteFillObject} />

        {/* Top Bar overlay */}
        <View style={styles.mapTopBar}>
          <View>
            <Text style={styles.mapGreeting}>Driver Dashboard</Text>
            <Text style={styles.mapName}>{currentUser?.name}</Text>
          </View>
          <View style={styles.mapTopRight}>
            <TouchableOpacity style={styles.mapIconBtn} onPress={() => navigation.navigate('Notifications')}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.textPrimary} />
              {unreadCount > 0 && <NotifBadge count={unreadCount} />}
            </TouchableOpacity>
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={12} color={COLORS.accent} />
              <Text style={styles.ratingText}>{currentUser?.rating || '4.8'}</Text>
            </View>
          </View>
        </View>

        {/* Stats strip */}
        <View style={styles.statsStrip}>
          {[
            { icon: 'car-sport-outline', value: activeRides.length, label: 'Active', color: COLORS.primary },
            { icon: 'people-outline', value: myRides.reduce((s, r) => s + r.bookedSeats, 0), label: 'Passengers', color: COLORS.secondary },
            { icon: 'wallet-outline', value: `Rs ${totalEarned > 0 ? totalEarned.toLocaleString() : '0'}`, label: 'Earned', color: COLORS.accent },
          ].map((s, i) => (
            <View key={i} style={styles.statPill}>
              <Ionicons name={s.icon} size={15} color={s.color} />
              <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {[
            { icon: 'add-circle-outline', label: 'Post Ride',  color: COLORS.primary,  screen: 'PostRide' },
            { icon: 'car-sport-outline',  label: 'My Rides',   color: COLORS.teal,     screen: 'MyRides' },
            { icon: 'car-outline',        label: 'My Vehicle', color: COLORS.purple,   screen: 'VehicleSetup' },
            { icon: 'star-outline',       label: 'Reviews',    color: COLORS.warning,  screen: 'DriverProfile' },
          ].map((action, i) => (
            <TouchableOpacity key={i} style={styles.actionCard} onPress={() => navigation.navigate(action.screen)}>
              <View style={[styles.actionIcon, { backgroundColor: action.color + '18' }]}>
                <Ionicons name={action.icon} size={26} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Vehicle Card */}
        {myVehicle ? (
          <>
            <SectionHeader title="My Vehicle" onSeeAll={() => navigation.navigate('VehicleSetup')} />
            <TouchableOpacity style={styles.vehicleCard} onPress={() => navigation.navigate('VehicleSetup')}>
              <View style={styles.vehicleIconBox}>
                <Ionicons name="car-sport" size={32} color={COLORS.primary} />
              </View>
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleName}>{myVehicle.brand}</Text>
                <Text style={styles.vehicleType}>{myVehicle.type} • {myVehicle.model}</Text>
                <View style={styles.plateRow}>
                  <Text style={styles.plateBadge}>{myVehicle.plateNumber}</Text>
                  <Text style={styles.seatsText}>{myVehicle.totalSeats} seats</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.addVehicleCard} onPress={() => navigation.navigate('VehicleSetup')}>
            <LinearGradient colors={['#eff6ff', '#dbeafe']} style={styles.addVehicleGrad}>
              <Ionicons name="add-circle-outline" size={40} color={COLORS.primary} />
              <Text style={styles.addVehicleTitle}>Add Your Vehicle</Text>
              <Text style={styles.addVehicleSub}>Register your car, bus, or coaster and start posting rides</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Recent Rides */}
        {myRides.length > 0 && (
          <>
            <SectionHeader title="My Rides" onSeeAll={() => navigation.navigate('MyRides')} />
            {myRides.slice(0, 2).map(ride => (
              <View key={ride.id} style={styles.rideCard}>
                <View style={styles.rideCardLeft}>
                  <Text style={styles.rideRoute}>{ride.from} → {ride.to}</Text>
                  <Text style={styles.rideDate}>{ride.date} • {ride.departureTime}</Text>
                  <View style={styles.rideMeta}>
                    <View style={styles.metaBadge}>
                      <Ionicons name="people-outline" size={12} color={COLORS.primary} />
                      <Text style={styles.metaBadgeText}>{ride.bookedSeats}/{ride.totalSeats}</Text>
                    </View>
                    <Text style={styles.rideEarned}>Rs {(ride.bookedSeats * ride.pricePerSeat).toLocaleString()} earned</Text>
                  </View>
                </View>
                <View style={[styles.statusDot, { backgroundColor: ride.bookedSeats < ride.totalSeats ? COLORS.secondary : COLORS.accent }]} />
              </View>
            ))}
          </>
        )}

        {/* Tip */}
        <LinearGradient colors={['#fff8e1', '#fff3cd']} style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={24} color={COLORS.accent} />
          <View style={styles.tipText}>
            <Text style={styles.tipTitle}>Pro Tip</Text>
            <Text style={styles.tipSub}>Uploading clear vehicle photos can increase bookings by 40%!</Text>
          </View>
        </LinearGradient>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // Map section
  mapSection: {
    height: 260,
    position: 'relative',
    overflow: 'hidden',
  },
  mapTopBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 40,
    left: 16, right: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  mapGreeting: { fontSize: 12, color: '#fff', fontWeight: '500', textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  mapName: { fontSize: 20, fontWeight: '800', color: '#fff', textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  mapTopRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mapIconBtn: {
    width: 40, height: 40, backgroundColor: '#fff', borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  ratingPill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  ratingText: { fontWeight: '700', fontSize: 13, color: COLORS.textPrimary },
  statsStrip: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.96)',
    paddingVertical: 10, paddingHorizontal: 16, gap: 8,
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
  },
  statPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, backgroundColor: COLORS.lightGray, borderRadius: 10, paddingVertical: 8,
  },
  statVal: { fontSize: 13, fontWeight: '800' },
  statLabel: { fontSize: 10, color: COLORS.gray },

  // Body
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 14 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  actionCard: {
    width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  actionIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  vehicleCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  vehicleIconBox: { width: 56, height: 56, borderRadius: 14, backgroundColor: COLORS.lightGray, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  vehicleInfo: { flex: 1 },
  vehicleName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  vehicleType: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  plateRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  plateBadge: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary, backgroundColor: COLORS.lightGray, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  seatsText: { fontSize: 12, color: COLORS.gray },
  addVehicleCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
  addVehicleGrad: { padding: 24, alignItems: 'center', borderRadius: 16, borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed' },
  addVehicleTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginTop: 12, marginBottom: 6 },
  addVehicleSub: { fontSize: 13, color: COLORS.gray, textAlign: 'center', lineHeight: 20 },
  rideCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  rideCardLeft: { flex: 1 },
  rideRoute: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  rideDate: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  rideMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 10 },
  metaBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, gap: 4 },
  metaBadgeText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  rideEarned: { fontSize: 12, color: COLORS.secondary, fontWeight: '600' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  tipCard: { borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 8 },
  tipText: { flex: 1 },
  tipTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  tipSub: { fontSize: 13, color: COLORS.gray, marginTop: 4, lineHeight: 20 },
});
