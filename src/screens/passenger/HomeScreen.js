import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, RideCard, SectionHeader, StatsCard, NotifBadge } from '../../components';
import { useApp } from '../../context/AppContext';
import { POPULAR_ROUTES } from '../../data/mockData';

const { width } = Dimensions.get('window');

export default function PassengerHomeScreen({ navigation }) {
  const { currentUser, rides, getDriverById, getVehicleById, unreadCount } = useApp();
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');

  const recentRides = rides.filter(r => r.status === 'active').slice(0, 3);

  const swapCities = () => { setFromCity(toCity); setToCity(fromCity); };

  const STATS = [
    { icon: 'car-sport-outline', value: `${rides.length}+`, label: 'Active Rides', colors: GRADIENTS.primary },
    { icon: 'people-outline', value: '500+', label: 'Drivers', colors: GRADIENTS.secondary },
    { icon: 'location-outline', value: '20+', label: 'Cities', colors: GRADIENTS.teal },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={GRADIENTS.primary} style={styles.header}>
        <View style={styles.bgCircle1} />
        <View style={styles.bgCircle2} />
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Assalam-o-Alaikum 👋</Text>
            <Text style={styles.userName}>{currentUser?.name}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            <NotifBadge count={unreadCount} />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Aaj Kahan Jaana Hai?</Text>

        {/* Search Box */}
        <View style={styles.searchCard}>
          <View style={styles.searchField}>
            <View style={[styles.searchDot, { backgroundColor: COLORS.primary }]} />
            <TextInput style={styles.searchInput} placeholder="Kahan se (e.g. Karachi)" value={fromCity} onChangeText={setFromCity} placeholderTextColor="#aaa" />
          </View>
          <TouchableOpacity onPress={swapCities} style={styles.swapBtn}>
            <Ionicons name="swap-vertical" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <View style={[styles.searchField, { borderTopWidth: 1, borderTopColor: COLORS.border }]}>
            <View style={[styles.searchDot, { backgroundColor: COLORS.secondary }]} />
            <TextInput style={styles.searchInput} placeholder="Kahan tak (e.g. Lahore)" value={toCity} onChangeText={setToCity} placeholderTextColor="#aaa" />
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Search', { from: fromCity, to: toCity })} style={styles.searchBtn}>
            <LinearGradient colors={GRADIENTS.primary} style={styles.searchBtnGrad}>
              <Ionicons name="search" size={18} color="#fff" />
              <Text style={styles.searchBtnText}>Rides Dhundho</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* Popular Routes */}
        <SectionHeader title="Popular Routes" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.routeScroll}>
          {POPULAR_ROUTES.map((route, i) => (
            <TouchableOpacity key={i} style={styles.routeChip} onPress={() => navigation.navigate('Search', { from: route.from, to: route.to })}>
              <LinearGradient colors={[`hsl(${i * 40 + 200}, 70%, 95%)`, `hsl(${i * 40 + 200}, 70%, 92%)`]} style={styles.routeChipGrad}>
                <Text style={styles.routeChipFrom}>{route.from}</Text>
                <Ionicons name="arrow-forward" size={12} color={COLORS.gray} style={{ marginHorizontal: 4 }} />
                <Text style={styles.routeChipTo}>{route.to}</Text>
              </LinearGradient>
              <Text style={styles.routeChipDist}>{route.distance}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {STATS.map((stat, i) => (
            <StatsCard key={i} icon={stat.icon} value={stat.value} label={stat.label} colors={stat.colors} style={styles.statCard} />
          ))}
        </View>

        {/* Recent Rides */}
        <SectionHeader title="Available Rides" onSeeAll={() => navigation.navigate('Search', { from: '', to: '' })} />
        {recentRides.map(ride => (
          <RideCard
            key={ride.id}
            ride={ride}
            driver={getDriverById(ride.driverId)}
            vehicle={getVehicleById(ride.vehicleId)}
            onPress={() => navigation.navigate('RideDetail', { rideId: ride.id })}
          />
        ))}

        {/* Safety Banner */}
        <LinearGradient colors={['#e8f5e9', '#c8e6c9']} style={styles.safetyBanner}>
          <Ionicons name="shield-checkmark" size={32} color={COLORS.secondary} />
          <View style={styles.safetyText}>
            <Text style={styles.safetyTitle}>100% Verified Drivers</Text>
            <Text style={styles.safetySub}>Har driver ka CNIC aur background check hota hai</Text>
          </View>
        </LinearGradient>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: 55, paddingBottom: 30, paddingHorizontal: 20, position: 'relative', overflow: 'hidden' },
  bgCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.06)', top: -60, right: -40 },
  bgCircle2: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.06)', bottom: -30, left: -20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  userName: { fontSize: 20, fontWeight: '800', color: '#fff' },
  notifBtn: { position: 'relative', padding: 4 },
  headerTitle: { fontSize: 15, color: 'rgba(255,255,255,0.85)', marginBottom: 16, fontWeight: '500' },
  searchCard: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8 },
  searchField: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  searchDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  searchInput: { flex: 1, paddingVertical: 16, fontSize: 15, color: COLORS.textPrimary },
  swapBtn: { alignSelf: 'flex-end', alignItems: 'flex-end', padding: 12, marginRight: 4 },
  searchBtn: { margin: 12, borderRadius: 12, overflow: 'hidden' },
  searchBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
  searchBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  body: { padding: 20 },
  routeScroll: { marginBottom: 20, marginHorizontal: -20, paddingHorizontal: 20 },
  routeChip: { marginRight: 12, alignItems: 'center' },
  routeChipGrad: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  routeChipFrom: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  routeChipTo: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  routeChipDist: { fontSize: 10, color: COLORS.gray, marginTop: 4, textAlign: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, gap: 8 },
  statCard: { flex: 1 },
  safetyBanner: { borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 20 },
  safetyText: { marginLeft: 16, flex: 1 },
  safetyTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  safetySub: { fontSize: 12, color: COLORS.gray, marginTop: 4, lineHeight: 18 },
});
