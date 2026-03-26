import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, EmptyState } from '../../components';
import { useApp } from '../../context/AppContext';

const TABS = ['Active', 'All'];

export default function MyRidesScreen({ navigation }) {
  const { getMyRides, getVehicleById } = useApp();
  const [activeTab, setActiveTab] = useState(0);
  const allRides = getMyRides();
  const rides = activeTab === 0 ? allRides.filter(r => r.status === 'active') : allRides;

  const renderRide = ({ item }) => {
    const vehicle = getVehicleById(item.vehicleId);
    const available = item.totalSeats - item.bookedSeats;
    const fillPercent = (item.bookedSeats / item.totalSeats) * 100;
    const earned = item.bookedSeats * item.pricePerSeat;

    return (
      <View style={styles.rideCard}>
        {/* Header */}
        <View style={styles.rideHeader}>
          <View>
            <Text style={styles.rideRoute}>{item.from} → {item.to}</Text>
            <Text style={styles.rideDate}>{item.date} • {item.departureTime}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: available > 0 ? '#e8f5e9' : '#fff8e1' }]}>
            <Text style={[styles.statusText, { color: available > 0 ? COLORS.secondary : COLORS.accent }]}>
              {available > 0 ? 'Open' : 'Full'}
            </Text>
          </View>
        </View>

        {/* Seat Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressLabel}>Seats Booked: {item.bookedSeats}/{item.totalSeats}</Text>
            <Text style={styles.progressPercent}>{Math.round(fillPercent)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${fillPercent}%` }]} />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="people-outline" size={16} color={COLORS.primary} />
            <Text style={styles.statText}>{item.bookedSeats} passengers</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="cash-outline" size={16} color={COLORS.secondary} />
            <Text style={styles.statText}>Rs {earned.toLocaleString()} earned</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="car-outline" size={16} color={COLORS.gray} />
            <Text style={styles.statText}>{vehicle?.type || 'Vehicle'}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="people-outline" size={16} color={COLORS.primary} />
            <Text style={styles.actionBtnText}>Passengers ({item.bookedSeats})</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: COLORS.danger + '50' }]}
            onPress={() => Alert.alert('Cancel Ride', 'Kya aap yeh ride cancel karna chahte hain?', [
              { text: 'Nahi', style: 'cancel' },
              { text: 'Haan', style: 'destructive' },
            ])}
          >
            <Ionicons name="close-circle-outline" size={16} color={COLORS.danger} />
            <Text style={[styles.actionBtnText, { color: COLORS.danger }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#00897b', '#00695c']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meri Rides</Text>
        <View style={styles.headerStats}>
          <View style={styles.headerStat}>
            <Text style={styles.headerStatVal}>{allRides.length}</Text>
            <Text style={styles.headerStatLabel}>Total</Text>
          </View>
          <View style={styles.headerStat}>
            <Text style={styles.headerStatVal}>{allRides.filter(r => r.status === 'active').length}</Text>
            <Text style={styles.headerStatLabel}>Active</Text>
          </View>
          <View style={styles.headerStat}>
            <Text style={[styles.headerStatVal, { color: COLORS.accent }]}>
              Rs {allRides.reduce((s, r) => s + r.bookedSeats * r.pricePerSeat, 0).toLocaleString()}
            </Text>
            <Text style={styles.headerStatLabel}>Earned</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map((tab, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.tab, activeTab === i && styles.tabActive]}
            onPress={() => setActiveTab(i)}
          >
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={rides}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderRide}
        ListEmptyComponent={
          <EmptyState
            icon="car-sport-outline"
            title="Koi Ride Nahi"
            subtitle="Abhi tak koi ride post nahi ki. Pehli ride post karen!"
          />
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('PostRide')}>
        <LinearGradient colors={['#00897b', '#00695c']} style={styles.fabGrad}>
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: 55, paddingBottom: 24, paddingHorizontal: 20 },
  backBtn: { marginBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 16 },
  headerStats: { flexDirection: 'row', gap: 20 },
  headerStat: { alignItems: 'center' },
  headerStatVal: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  tabActive: { backgroundColor: COLORS.lightGray },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.gray },
  tabTextActive: { color: COLORS.textPrimary },
  listContent: { padding: 16, paddingBottom: 80 },
  rideCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  rideHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  rideRoute: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  rideDate: { fontSize: 12, color: COLORS.gray, marginTop: 3 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },
  progressSection: { marginBottom: 12 },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, color: COLORS.gray, fontWeight: '500' },
  progressPercent: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  progressBar: { height: 8, backgroundColor: COLORS.lightGray, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 12, marginBottom: 12 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: COLORS.primary + '40', borderRadius: 10, paddingVertical: 8, gap: 6 },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  fab: { position: 'absolute', bottom: 24, right: 24, borderRadius: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
  fabGrad: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});
