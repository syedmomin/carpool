import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, GradientHeader, EmptyState } from '../../components';
import { ridesApi } from '../../services/api';

const TABS = ['All Time', 'This Month', 'This Week'];

function filterByTab(rides: any[], tab: number) {
  if (tab === 0) return rides;
  const now = new Date();
  return rides.filter(r => {
    const d = new Date(r.date);
    if (tab === 1) {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }
    // This week: Mon–Sun of current week
    const day = now.getDay() === 0 ? 6 : now.getDay() - 1; // Mon=0
    const monday = new Date(now); monday.setDate(now.getDate() - day); monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6); sunday.setHours(23, 59, 59, 999);
    return d >= monday && d <= sunday;
  });
}

// Compute confirmed seats from bookings array (same logic as MyRidesScreen)
function confirmedSeats(ride: any): number {
  return (ride.bookings || [])
    .filter((b: any) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
    .reduce((s: number, b: any) => s + (b.seats || 1), 0);
}

export default function EarningsScreen({ navigation }) {
  const [myRides, setMyRides] = useState([]);
  const [tab,     setTab]     = useState(0);

  const normalize = r => ({ ...r, from: r.fromCity || r.from, to: r.toCity || r.to });

  useFocusEffect(useCallback(() => {
    ridesApi.myRides(1, 200).then(({ data }) => {
      if (data?.data) setMyRides(data.data.map(normalize));
    });
  }, []));

  const filtered = filterByTab(myRides.filter(r => r.status === 'COMPLETED' || r.status === 'IN_PROGRESS'), tab);

  const total           = filtered.reduce((s, r) => s + (confirmedSeats(r) * r.pricePerSeat || 0), 0);
  const totalPassengers = filtered.reduce((s, r) => s + confirmedSeats(r), 0);
  const avgPerRide      = filtered.length > 0 ? Math.round(total / filtered.length) : 0;

  return (
    <View style={styles.container}>
      <GradientHeader
        colors={GRADIENTS.secondary as any}
        title="My Earnings"
        subtitle="Track your income"
        onBack={() => navigation.goBack()}
      >
        {/* Big total */}
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>
            {tab === 0 ? 'Total Earned' : tab === 1 ? 'This Month' : 'This Week'}
          </Text>
          <Text style={styles.totalAmount}>Rs {total.toLocaleString()}</Text>
        </View>
      </GradientHeader>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { icon: 'car-sport-outline', label: 'Rides',       value: filtered.length,                           color: COLORS.primary },
            { icon: 'people-outline',    label: 'Passengers',  value: totalPassengers,                           color: COLORS.teal },
            { icon: 'trending-up',       label: 'Avg / Ride',  value: `Rs ${avgPerRide.toLocaleString()}`,       color: COLORS.secondary },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: s.color + '15' }]}>
                <Ionicons name={(s.icon) as any} size={20} color={s.color} />
              </View>
              <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Tab Pills */}
        <View style={styles.tabRow}>
          {TABS.map((t, i) => (
            <TouchableOpacity key={i} style={[styles.tab, tab === i && styles.tabActive]} onPress={() => setTab(i)}>
              <Text style={[styles.tabText, tab === i && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Ride Earnings List */}
        <Text style={styles.sectionTitle}>Ride Breakdown</Text>
        {filtered.length === 0 ? (
          <EmptyState icon="wallet-outline" title="No Earnings Yet" subtitle={tab === 0 ? 'Post your first ride to start earning!' : 'No completed rides in this period.'} />
        ) : (
          filtered.map(ride => {
            const seats  = confirmedSeats(ride);
            const earned = seats * ride.pricePerSeat;
            return (
              <View key={ride.id} style={styles.rideCard}>
                <View style={styles.rideLeft}>
                  <LinearGradient colors={GRADIENTS.secondary as any} style={styles.rideIconBox}>
                    <Ionicons name="car-sport" size={18} color="#fff" />
                  </LinearGradient>
                  <View>
                    <Text style={styles.rideRoute}>{ride.from} → {ride.to}</Text>
                    <Text style={styles.rideDate}>{ride.date} • {ride.departureTime}</Text>
                    <View style={styles.rideMeta}>
                      <Ionicons name="people-outline" size={12} color={COLORS.gray} />
                      <Text style={styles.rideMetaText}>{seats} confirmed passenger{seats !== 1 ? 's' : ''}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.rideRight}>
                  <Text style={styles.rideEarned}>Rs {earned.toLocaleString()}</Text>
                  <Text style={styles.ridePerSeat}>Rs {ride.pricePerSeat}/seat</Text>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.bg },
  totalBox:    { marginTop: 16, alignItems: 'center' },
  totalLabel:  { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  totalAmount: { fontSize: 36, fontWeight: '900', color: '#fff' },
  body:        { flex: 1, padding: 20 },
  statsRow:    { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard:    { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  statIcon:    { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statVal:     { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  statLabel:   { fontSize: 10, color: COLORS.gray, textAlign: 'center' },
  tabRow:      { flexDirection: 'row', backgroundColor: COLORS.lightGray, borderRadius: 14, padding: 4, marginBottom: 20 },
  tab:         { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  tabActive:   { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText:     { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  tabTextActive:  { color: COLORS.primary },
  sectionTitle:   { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  rideCard:    { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  rideLeft:    { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  rideIconBox: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rideRoute:   { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  rideDate:    { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  rideMeta:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  rideMetaText:{ fontSize: 11, color: COLORS.gray },
  rideRight:   { alignItems: 'flex-end' },
  rideEarned:  { fontSize: 16, fontWeight: '800', color: COLORS.secondary },
  ridePerSeat: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
});
