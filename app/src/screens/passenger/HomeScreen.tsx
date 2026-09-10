import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable,
  Modal, FlatList, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, PulseBadge, CURVE, RideCard, SectionHeader, RideCardSkeleton, EmptyState, RoutePicker } from '../../components';
import CitySearchModal from '../../components/CitySearchModal';
import { useApp } from '../../context/AppContext';
import { useSocketData } from '../../context/SocketDataContext';
import { socketService } from '../../services/socket.service';
import { useToast } from '../../context/ToastContext';
import { useDoubleBackExit } from '../../utils/useDoubleBackExit';


function getUpcomingDates() {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 10; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow'
      : d.toLocaleDateString('en-PK', { weekday: 'short', month: 'short', day: 'numeric' });
    dates.push({ value: `${yyyy}-${mm}-${dd}`, label });
  }
  return dates;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

const UPCOMING_DATES = getUpcomingDates();

// ─── Quick Action Tile ────────────────────────────────────────────────────────
function QuickAction({ icon, label, onPress }) {
  return (
    <Pressable style={styles.quickTile} onPress={onPress}>
      <View style={styles.quickIconWrap}>
        <Ionicons name={icon} size={22} color={COLORS.primary} />
      </View>
      <Text style={styles.quickLabel} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
    </Pressable>
  );
}

export default function PassengerHomeScreen({ navigation }) {
  const { currentUser, unreadCount } = useApp();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const { availableRides, availableRidesState, loadAvailableRides } = useSocketData() as any;
  useDoubleBackExit();

  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [scheduleModal, setScheduleModal] = useState(false);
  const [cityModal, setCityModal] = useState<'from' | 'to' | null>(null);

  useEffect(() => {
    const onNewRide = (data: any) => {
      showToast(`New ride: ${data.fromCity || data.from} > ${data.toCity || data.to}`, 'info');
    };
    socketService.on('NEW_RIDE', onNewRide);
    return () => socketService.off('NEW_RIDE', onNewRide);
  }, []);

  useFocusEffect(useCallback(() => {
    loadAvailableRides(1, 20);
  }, [loadAvailableRides]));

  const swapCities = () => { setFromCity(toCity); setToCity(fromCity); };

  const handleFindRide = () => {
    navigation.navigate('Search', {
      from: fromCity,
      to: toCity,
      date: selectedDate || UPCOMING_DATES[0].value,
    });
  };

  const displayDate = selectedDate
    ? UPCOMING_DATES.find(d => d.value === selectedDate)?.label || selectedDate
    : 'Today';

  const firstName = currentUser?.name?.split(' ')[0] || 'there';

  // Popular Rides — reuses the same available-rides feed the Search tab shows.
  const popularRides = useMemo(() => (
    (availableRides || [])
      .filter((r: any) => r.status === 'ACTIVE' && (r.totalSeats - r.bookedSeats) > 0)
      .slice(0, 4)
  ), [availableRides]);

  return (
    <View style={styles.container}>
      {/* Top Bar — greeting replaces the old location pill */}
      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <View style={styles.greetRow}>
          <Text style={styles.greetName}>{getGreeting()}, {firstName} 👋</Text>
          <Text style={styles.greetSub}>Where are you going today?</Text>
        </View>
        <Pressable style={styles.notifBtn} onPress={() => navigation.navigate('PassengerHomeTab', { screen: 'Notifications' })}>
          <View style={styles.notifIconContainer}>
            <Ionicons name={unreadCount > 0 ? 'notifications' : 'notifications-outline'} size={24} color="#fff" />
            <PulseBadge count={unreadCount} />
          </View>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* From / To */}
        <RoutePicker
          fromValue={fromCity}
          toValue={toCity}
          toPlaceholder="Where to?"
          onPressFrom={() => setCityModal('from')}
          onPressTo={() => setCityModal('to')}
          onSwap={swapCities}
        />

        {/* Date Row */}
        <View style={styles.dateRow}>
          <Pressable
            style={[styles.datePill, !selectedDate && styles.datePillActive]}
            onPress={() => setSelectedDate(null)}
          >
            <Text style={[styles.datePillText, !selectedDate && styles.datePillActiveText]}>Today</Text>
          </Pressable>
          <Pressable
            style={[styles.datePill, !!selectedDate && styles.datePillActive]}
            onPress={() => setScheduleModal(true)}
          >
            <Ionicons name="calendar-outline" size={13} color={selectedDate ? '#fff' : COLORS.gray} />
            <Text style={[styles.datePillText, !!selectedDate && styles.datePillActiveText]}>
              {selectedDate ? displayDate : 'Pick Date'}
            </Text>
          </Pressable>
        </View>

        {/* Find Rides Button */}
        <Pressable onPress={handleFindRide} style={styles.findBtn}>
          <LinearGradient
            colors={GRADIENTS.primary as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.findBtnGradient}
          >
            <Text style={styles.findBtnText}>Find Ride</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
          </LinearGradient>
        </Pressable>

        {/* Quick Actions */}
        <View style={styles.quickRow}>
          <QuickAction icon="flash-outline" label="Ride Now" onPress={handleFindRide} />
          <QuickAction icon="search-outline" label="Find Rides" onPress={() => navigation.navigate('SearchTab')} />
          <QuickAction
            icon="add-circle-outline"
            label="Post Request"
            onPress={() => navigation.navigate('RequestsTab', { screen: 'PostRequest' })}
          />
          <QuickAction
            icon="receipt-outline"
            label="My Bookings"
            onPress={() => navigation.navigate('BookingHistoryTab', { screen: 'BookingHistoryMain' })}
          />
        </View>

        {/* Available Rides */}
        <SectionHeader
          title="Available Rides"
          onSeeAll={() => navigation.navigate('SearchTab')}
          style={styles.popularHeader}
        />
        {(!availableRidesState?.loaded && availableRidesState?.loading) ? (
          [1, 2, 3].map(i => <RideCardSkeleton key={i} />)
        ) : popularRides.length > 0 ? (
          popularRides.map((item: any, index: number) => (
            <RideCard
              key={item.id}
              ride={item}
              driver={item.driver}
              vehicle={item.vehicle}
              index={index}
              onPress={() => navigation.navigate('RideDetail', { rideId: item.id, rideData: item })}
            />
          ))
        ) : (
          <EmptyState
            title="No Rides Yet"
            subtitle="Drivers haven't posted any rides on your route today, try again in a bit."
          />
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Shared City Search Modal */}
      <CitySearchModal
        visible={cityModal === 'from'}
        title="Leaving From"
        onSelect={name => { setFromCity(name); setCityModal(null); }}
        onClose={() => setCityModal(null)}
      />
      <CitySearchModal
        visible={cityModal === 'to'}
        title="Going To"
        onSelect={name => { setToCity(name); setCityModal(null); }}
        onClose={() => setCityModal(null)}
      />

      {/* Date Picker Modal */}
      <Modal visible={scheduleModal} animationType="slide" transparent onRequestClose={() => setScheduleModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Travel Date</Text>
              <Pressable onPress={() => setScheduleModal(false)} style={styles.modalClose}>
                <Ionicons name="close" size={22} color={COLORS.textPrimary} />
              </Pressable>
            </View>
            <FlatList
              data={UPCOMING_DATES}
              keyExtractor={item => item.value}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => {
                const isSel = selectedDate === item.value;
                return (
                  <Pressable
                    style={[styles.dateItem, isSel && styles.dateItemActive]}
                    onPress={() => { setSelectedDate(item.value); setScheduleModal(false); }}
                  >
                    <View style={[styles.dateIcon, isSel && styles.dateIconActive]}>
                      <Ionicons name="calendar" size={18} color={isSel ? '#fff' : COLORS.primary} />
                    </View>
                    <View style={styles.dateLabelWrap}>
                      <Text style={[styles.dateLabel, isSel && { color: COLORS.primary, fontWeight: '800' }]}>
                        {item.label}
                      </Text>
                      <Text style={styles.dateValue}>{item.value}</Text>
                    </View>
                    {isSel && <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    paddingHorizontal: 20, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    backgroundColor: COLORS.bg,
  },
  notifBtn: { position: 'relative', marginTop: 2 },
  notifIconContainer: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  notifBadgeMini: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: COLORS.danger, borderRadius: 9, minWidth: 18, height: 18,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.white,
  },
  notifBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: '700' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 12 },

  // Greeting
  greetRow: { flex: 1, paddingRight: 12 },
  greetName: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  greetSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },

  // Date pills
  dateRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  datePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border,
    backgroundColor: COLORS.cardBg,
    ...CURVE,
  },
  datePillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  datePillText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  datePillActiveText: { fontSize: 12, fontWeight: '700', color: COLORS.white },

  // Find Ride button
  findBtn: {
    borderRadius: 12, overflow: 'hidden', marginBottom: 20,
    ...CURVE,
  },
  findBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, gap: 6,
  },
  findBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },

  // Quick actions
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, gap: 8 },
  quickTile: { flex: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.cardBg, borderWidth: 1, borderColor: COLORS.border, ...CURVE },
  quickIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
  quickLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },

  // Popular rides
  popularHeader: { marginBottom: 12 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: COLORS.cardBg, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 12, maxHeight: '75%' },
  modalHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 8 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  modalClose: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.lightGray, alignItems: 'center', justifyContent: 'center' },
  dateItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, gap: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  dateItemActive: { backgroundColor: COLORS.primaryLight },
  dateIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  dateIconActive: { backgroundColor: COLORS.primary },
  dateLabelWrap: { flex: 1 },
  dateLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  dateValue: { fontSize: 11.5, color: COLORS.textSecondary, marginTop: 2 },
});
