import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SectionHeader, StarRating, EmptyState } from '../../components';
import { useApp } from '../../context/AppContext';

export default function DriverHomeScreen({ navigation }) {
  const { currentUser, getMyRides, getVehicleByDriver, unreadCount } = useApp();
  const myRides = getMyRides();
  const myVehicle = getVehicleByDriver(currentUser?.id);
  const activeRides = myRides.filter(r => r.status === 'active');
  const totalEarned = myRides.reduce((sum, r) => sum + (r.bookedSeats * r.pricePerSeat), 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={['#00897b', '#00695c']} style={styles.header}>
        <View style={styles.bgCircle} />
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Driver Dashboard</Text>
            <Text style={styles.userName}>{currentUser?.name}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.notifBtn}>
              <Ionicons name="notifications-outline" size={22} color="#fff" />
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color={COLORS.accent} />
              <Text style={styles.ratingText}>{currentUser?.rating || '4.8'}</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {[
            { icon: 'car-sport-outline', value: activeRides.length, label: 'Active Rides', color: '#fff' },
            { icon: 'people-outline', value: myRides.reduce((s, r) => s + r.bookedSeats, 0), label: 'Passengers', color: '#fff' },
            { icon: 'wallet-outline', value: `Rs ${totalEarned.toLocaleString()}`, label: 'Earned', color: COLORS.accent },
          ].map((stat, i) => (
            <View key={i} style={styles.statCard}>
              <Ionicons name={stat.icon} size={20} color={stat.color} />
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* Quick Actions */}
        <SectionHeader title="Quick Actions" />
        <View style={styles.actionsGrid}>
          {[
            { icon: 'add-circle-outline', label: 'Post Ride', color: '#1a73e8', screen: 'PostRide' },
            { icon: 'car-sport-outline', label: 'My Rides', color: '#00897b', screen: 'MyRides' },
            { icon: 'car-outline', label: 'My Vehicle', color: '#7b1fa2', screen: 'VehicleSetup' },
            { icon: 'star-outline', label: 'Reviews', color: '#f57c00', screen: 'DriverProfile' },
          ].map((action, i) => (
            <TouchableOpacity
              key={i}
              style={styles.actionCard}
              onPress={() => navigation.navigate(action.screen)}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '15' }]}>
                <Ionicons name={action.icon} size={26} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Vehicle Card */}
        {myVehicle ? (
          <>
            <SectionHeader title="Meri Gaari" onSeeAll={() => navigation.navigate('VehicleSetup')} />
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
              <Text style={styles.addVehicleTitle}>Vehicle Add Karen</Text>
              <Text style={styles.addVehicleSub}>Apni gaari, bus ya coaster register karen aur rides post karen</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Recent Rides */}
        {myRides.length > 0 && (
          <>
            <SectionHeader title="Meri Rides" onSeeAll={() => navigation.navigate('MyRides')} />
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
                    <Text style={styles.rideEarned}>
                      Rs {(ride.bookedSeats * ride.pricePerSeat).toLocaleString()} earned
                    </Text>
                  </View>
                </View>
                <View style={[styles.statusDot, { backgroundColor: ride.bookedSeats < ride.totalSeats ? COLORS.secondary : COLORS.accent }]} />
              </View>
            ))}
          </>
        )}

        {/* Tips */}
        <LinearGradient colors={['#fff8e1', '#fff3cd']} style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={24} color={COLORS.accent} />
          <View style={styles.tipText}>
            <Text style={styles.tipTitle}>Pro Tip</Text>
            <Text style={styles.tipSub}>Vehicle ki clear photos upload karne se 40% zyada bookings milti hain!</Text>
          </View>
        </LinearGradient>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: 55, paddingBottom: 24, paddingHorizontal: 20, position: 'relative', overflow: 'hidden' },
  bgCircle: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.06)', top: -60, right: -40 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  userName: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  notifBtn: { position: 'relative' },
  notifBadge: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.danger, alignItems: 'center', justifyContent: 'center' },
  notifBadgeText: { fontSize: 9, color: '#fff', fontWeight: '700' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 4 },
  ratingText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: 14, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  body: { padding: 20 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  actionCard: { width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  actionIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  vehicleCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
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
