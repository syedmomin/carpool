import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Dimensions, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, NotifBadge } from '../../components';
import MapBackground from '../../components/MapBackground';
import { useApp } from '../../context/AppContext';
import { POPULAR_ROUTES } from '../../data/mockData';

const { width } = Dimensions.get('window');

const CAR_MARKERS = [
  { id: 1, latitude: 24.8880, longitude: 67.0600 },
  { id: 2, latitude: 24.8560, longitude: 67.0180 },
  { id: 3, latitude: 24.8720, longitude: 67.0900 },
  { id: 4, latitude: 24.8400, longitude: 66.9900 },
  { id: 5, latitude: 24.9100, longitude: 67.1100 },
];

export default function PassengerHomeScreen({ navigation }) {
  const { currentUser, rides, unreadCount } = useApp();
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');

  const swapCities = () => { setFromCity(toCity); setToCity(fromCity); };

  return (
    <View style={styles.container}>
      {/* ── Map Background ── */}
      <MapBackground markers={CAR_MARKERS} style={styles.mapSection} />

      {/* ── Top Bar (absolute) ── */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.menuBtn}>
          <Ionicons name="menu" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.topCenter}>
          <Ionicons name="location" size={13} color={COLORS.primary} />
          <Text style={styles.locationText}>Karachi, Pakistan</Text>
          <Ionicons name="chevron-down" size={13} color={COLORS.gray} />
        </View>

        <TouchableOpacity
          style={styles.notifBtn}
          onPress={() => navigation.navigate('Notifications')}
        >
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>{currentUser?.name?.charAt(0) || 'U'}</Text>
          </View>
          {unreadCount > 0 && <NotifBadge count={unreadCount} />}
        </TouchableOpacity>
      </View>

      {/* ── Bottom Sheet ── */}
      <View style={styles.bottomSheet}>
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetTitle}>Find a Ride</Text>

        {/* From / To */}
        <View style={styles.routeCard}>
          <View style={styles.routeLeft}>
            <View style={[styles.routeDot, { backgroundColor: COLORS.primary }]} />
            <View style={styles.routeVertLine} />
            <View style={[styles.routeDot, { backgroundColor: COLORS.secondary }]} />
          </View>
          <View style={styles.routeInputs}>
            <TextInput
              style={styles.routeInput}
              placeholder="Leaving From"
              placeholderTextColor={COLORS.gray}
              value={fromCity}
              onChangeText={setFromCity}
            />
            <View style={styles.routeInputDivider} />
            <TextInput
              style={styles.routeInput}
              placeholder="Going To"
              placeholderTextColor={COLORS.gray}
              value={toCity}
              onChangeText={setToCity}
            />
          </View>
          <TouchableOpacity onPress={swapCities} style={styles.swapBtn}>
            <Ionicons name="swap-vertical" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Date Toggle */}
        <View style={styles.dateRow}>
          <TouchableOpacity style={[styles.datePill, styles.datePillActive]}>
            <Text style={styles.datePillActiveText}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.datePill}>
            <Ionicons name="calendar-outline" size={13} color={COLORS.gray} />
            <Text style={styles.datePillText}>Schedule</Text>
          </TouchableOpacity>
        </View>

        {/* Find Rides Button */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Search', { from: fromCity, to: toCity })}
          activeOpacity={0.85}
        >
          <LinearGradient colors={GRADIENTS.primary} style={styles.findBtn}>
            <Text style={styles.findBtnText}>Find Ride</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Popular Routes */}
        <Text style={styles.popularTitle}>Popular Routes</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {POPULAR_ROUTES.map((route, i) => (
            <TouchableOpacity
              key={i}
              style={styles.routeChip}
              onPress={() => navigation.navigate('Search', { from: route.from, to: route.to })}
            >
              <Ionicons name="location-outline" size={11} color={COLORS.primary} />
              <Text style={styles.routeChipText}>{route.from} → {route.to}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e8f0e8' },

  // Map fills top portion
  mapSection: { flex: 1 },

  // Top Bar
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 52 : 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  menuBtn: {
    width: 44, height: 44,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4,
  },
  topCenter: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 8, gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4,
  },
  locationText: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  notifBtn: { position: 'relative' },
  avatarBox: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Bottom Sheet
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 20,
  },
  sheetHandle: {
    width: 40, height: 4,
    backgroundColor: COLORS.border, borderRadius: 2,
    alignSelf: 'center', marginBottom: 16,
  },
  sheetTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 16 },

  // Route Card
  routeCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 16, padding: 14, marginBottom: 12, gap: 12,
  },
  routeLeft: { alignItems: 'center', gap: 3 },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  routeVertLine: { width: 2, height: 22, backgroundColor: COLORS.border },
  routeInputs: { flex: 1 },
  routeInput: { fontSize: 14, fontWeight: '500', color: COLORS.textPrimary, paddingVertical: 6 },
  routeInputDivider: { height: 1, backgroundColor: COLORS.border },
  swapBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },

  // Date Toggle
  dateRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  datePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  datePillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  datePillActiveText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  datePillText: { fontSize: 13, fontWeight: '600', color: COLORS.gray },

  // Find Button
  findBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 15, borderRadius: 16, gap: 8, marginBottom: 16,
  },
  findBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Popular Routes
  popularTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 10 },
  routeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, marginRight: 8,
  },
  routeChipText: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary },
});
