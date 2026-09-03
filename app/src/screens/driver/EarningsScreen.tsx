import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CURVE, AppBar, EmptyState, RideCardSkeleton, AnimatedNumber, TabPills, SectionHeader } from '../../components';
import { ridesApi } from '../../services/api';
import { formatLocalDate, getTodayStr } from '../../utils/date';

const TABS = ['Daily', 'Weekly', 'Monthly'];

function getWeekRange(now: Date) {
  const day = now.getDay() === 0 ? 6 : now.getDay() - 1; // Mon=0
  const monday = new Date(now); monday.setDate(now.getDate() - day); monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6); sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

// tab 0 = Daily (today), 1 = Weekly (this week), 2 = Monthly (this month)
function filterByTab(rides: any[], tab: number, now: Date) {
  const todayStr = formatLocalDate(now);
  if (tab === 0) return rides.filter(r => r.date === todayStr);
  if (tab === 1) {
    const { monday, sunday } = getWeekRange(now);
    return rides.filter(r => { const d = new Date(r.date); return d >= monday && d <= sunday; });
  }
  return rides.filter(r => {
    const d = new Date(r.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
}

// Same window, shifted back one period — used for the "vs previous period" delta.
function filterByPreviousTab(rides: any[], tab: number, now: Date) {
  if (tab === 0) {
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    const yStr = formatLocalDate(yesterday);
    return rides.filter(r => r.date === yStr);
  }
  if (tab === 1) {
    const { monday } = getWeekRange(now);
    const prevMonday = new Date(monday); prevMonday.setDate(monday.getDate() - 7);
    const prevSunday = new Date(monday); prevSunday.setDate(monday.getDate() - 1); prevSunday.setHours(23, 59, 59, 999);
    return rides.filter(r => { const d = new Date(r.date); return d >= prevMonday && d <= prevSunday; });
  }
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return rides.filter(r => {
    const d = new Date(r.date);
    return d.getFullYear() === prevMonth.getFullYear() && d.getMonth() === prevMonth.getMonth();
  });
}

function getDateRowLabel(tab: number, now: Date): string {
  if (tab === 0) {
    return `Today, ${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  }
  if (tab === 1) {
    const { monday, sunday } = getWeekRange(now);
    const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    return `${fmt(monday)} - ${fmt(sunday)}`;
  }
  return now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

// Compute confirmed seats from bookings array (same logic as MyRidesScreen)
function confirmedSeats(ride: any): number {
  return (ride.bookings || [])
    .filter((b: any) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
    .reduce((s: number, b: any) => s + (b.seats || 1), 0);
}

function earningsOf(rides: any[]) {
  return rides.reduce((s, r) => s + (confirmedSeats(r) * r.pricePerSeat || 0), 0);
}

export default function EarningsScreen({ navigation }) {
  const [myRides, setMyRides] = useState([]);
  const [tab,     setTab]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);

  const normalize = r => ({ ...r, from: r.fromCity || r.from, to: r.toCity || r.to });

  useFocusEffect(useCallback(() => {
    setLoading(true);
    ridesApi.myRides(1, 200).then(({ data }) => {
      if (data?.data) setMyRides(data.data.map(normalize));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []));

  const now = new Date();
  const completedOrActive = myRides.filter(r => r.status === 'COMPLETED' || r.status === 'IN_PROGRESS');
  const filtered      = filterByTab(completedOrActive, tab, now);
  const prevFiltered   = filterByPreviousTab(completedOrActive, tab, now);

  const total           = earningsOf(filtered);
  const prevTotal        = earningsOf(prevFiltered);
  const totalPassengers = filtered.reduce((s, r) => s + confirmedSeats(r), 0);
  const avgPerRide      = filtered.length > 0 ? Math.round(total / filtered.length) : 0;

  const deltaPct = prevTotal > 0
    ? Math.round(((total - prevTotal) / prevTotal) * 100)
    : (total > 0 ? 100 : 0);
  const deltaCompareLabel = tab === 0 ? 'vs yesterday' : tab === 1 ? 'vs last week' : 'vs last month';

  return (
    <View style={styles.container}>
      <AppBar
        title="Earnings"
        onBack={() => navigation.goBack()}
        rightIcon="calendar-outline"
        onRightPress={() => setPickerOpen(true)}
      />

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Segmented control */}
        <TabPills
          tabs={TABS.map((t, i) => ({ label: t, value: i }))}
          activeTab={tab}
          onSelect={setTab}
          style={{ marginBottom: 16 }}
        />

        {/* Date row */}
        <Pressable style={styles.dateRow} onPress={() => setPickerOpen(true)}>
          <Ionicons name="calendar-outline" size={15} color={COLORS.textSecondary} />
          <Text style={styles.dateRowText}>{getDateRowLabel(tab, now)}</Text>
          <Ionicons name="chevron-down" size={15} color={COLORS.textSecondary} />
        </Pressable>

        {/* Hero card */}
        <View style={styles.heroCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.totalLabel}>Total Earnings</Text>
            <AnimatedNumber value={total} prefix="Rs. " style={styles.totalAmount} />
            <View style={styles.deltaRow}>
              <Ionicons name={deltaPct >= 0 ? 'arrow-up' : 'arrow-down'} size={12} color={COLORS.white} />
              <Text style={styles.deltaText}>{Math.abs(deltaPct)}% {deltaCompareLabel}</Text>
            </View>
          </View>
          <View style={styles.heroIconChip}>
            <Ionicons name="wallet" size={26} color={COLORS.white} />
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { icon: 'car-sport-outline', label: 'Rides',      value: filtered.length,                     color: COLORS.primary },
            { icon: 'people-outline',    label: 'Passengers', value: totalPassengers,                     color: COLORS.primary },
            { icon: 'trending-up',       label: 'Avg / Ride',  value: `Rs ${avgPerRide.toLocaleString()}`, color: COLORS.secondary },
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

        {/* Recent Transactions */}
        <SectionHeader title="Recent Transactions" />
        {loading ? (
          <View style={{ gap: 10 }}>
            {[1, 2, 3].map(i => <RideCardSkeleton key={i} />)}
          </View>
        ) : filtered.length === 0 ? (
          <EmptyState icon="wallet-outline" title="No Earnings Yet" subtitle={tab === 0 ? 'No completed rides today.' : tab === 1 ? 'No completed rides this week.' : 'No completed rides this month.'} />
        ) : (
          filtered.map(ride => {
            const seats  = confirmedSeats(ride);
            const earned = seats * ride.pricePerSeat;
            return (
              <View key={ride.id} style={styles.rideCard}>
                <View style={styles.rideLeft}>
                  <View style={styles.rideIconBox}>
                    <Ionicons name="car-sport" size={18} color={COLORS.secondary} />
                  </View>
                  <View>
                    <Text style={styles.rideRoute}>{ride.from} {'>'} {ride.to}</Text>
                    <Text style={styles.rideDate}>{ride.date} · {ride.departureTime}</Text>
                    <View style={styles.rideMeta}>
                      <Ionicons name="people-outline" size={12} color={COLORS.gray} />
                      <Text style={styles.rideMetaText}>{seats} confirmed passenger{seats !== 1 ? 's' : ''}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.rideRight}>
                  <Text style={styles.rideEarned}>+Rs {earned.toLocaleString()}</Text>
                  <Text style={styles.ridePerSeat}>Rs {ride.pricePerSeat}/seat</Text>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Period picker */}
      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setPickerOpen(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Period</Text>
            {TABS.map((t, i) => (
              <Pressable
                key={i}
                style={[styles.modalOption, tab === i && styles.modalOptionActive]}
                onPress={() => { setTab(i); setPickerOpen(false); }}
              >
                <Text style={[styles.modalOptionText, tab === i && styles.modalOptionTextActive]}>{t}</Text>
                {tab === i && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.bg },
  heroCard:    { backgroundColor: COLORS.primary, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 20, ...CURVE },
  heroIconChip:{ width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  totalLabel:  { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 4 },
  totalAmount: { fontSize: 30, fontWeight: '700', color: COLORS.white },
  deltaRow:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  deltaText:   { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.95)' },
  body:        { flex: 1, padding: 20, paddingTop: 0 },
  dateRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginBottom: 16 },
  dateRowText: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  statsRow:    { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard:    { flex: 1, backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, ...CURVE },
  statIcon:    { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8, ...CURVE },
  statVal:     { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  statLabel:   { fontSize: 10, color: COLORS.textSecondary, textAlign: 'center' },
  rideCard:    { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: COLORS.border, ...CURVE },
  rideLeft:    { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  rideIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e8f5e9', ...CURVE },
  rideRoute:   { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  rideDate:    { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  rideMeta:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  rideMetaText:{ fontSize: 11, color: COLORS.textSecondary },
  rideRight:   { alignItems: 'flex-end' },
  rideEarned:  { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  ridePerSeat: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  modalCard:   { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, width: '100%', ...CURVE },
  modalTitle:  { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8, paddingHorizontal: 4 },
  modalOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, paddingHorizontal: 8, borderRadius: 10 },
  modalOptionActive: { backgroundColor: COLORS.primaryLight },
  modalOptionText: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  modalOptionTextActive: { color: COLORS.primary, fontWeight: '700' },
});
