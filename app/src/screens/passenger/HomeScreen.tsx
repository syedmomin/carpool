import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Platform, Modal, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS } from '../../components';
import CitySearchModal from '../../components/CitySearchModal';
import MapBackground from '../../components/MapBackground';
import { useApp } from '../../context/AppContext';
import { socketService } from '../../services/socket.service';
import { useToast } from '../../context/ToastContext';

const { width } = Dimensions.get('window');

function getUpcomingDates() {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 10; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow'
      : d.toLocaleDateString('en-PK', { weekday: 'short', month: 'short', day: 'numeric' });
    dates.push({ value: `${yyyy}-${mm}-${dd}`, label });
  }
  return dates;
}

const UPCOMING_DATES = getUpcomingDates();

export default function PassengerHomeScreen({ navigation }) {
  const { currentUser, unreadCount } = useApp();
  const { showToast } = useToast();

  const [fromCity, setFromCity]     = useState('');
  const [toCity, setToCity]         = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [scheduleModal, setScheduleModal] = useState(false);
  const [cityModal, setCityModal]   = useState<'from' | 'to' | null>(null);

  useEffect(() => {
    const onNewRide = (data: any) => {
      showToast(`New ride: ${data.fromCity || data.from} → ${data.toCity || data.to}`, 'info');
    };
    socketService.on('NEW_RIDE', onNewRide);
    return () => socketService.off('NEW_RIDE', onNewRide);
  }, []);

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

  return (
    <View style={styles.container}>
      <MapBackground style={styles.mapSection} />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topCenter}>
          <Ionicons name="location" size={13} color={COLORS.primary} />
          <Text style={styles.locationText}>Pakistan</Text>
          <Ionicons name="chevron-down" size={13} color={COLORS.gray} />
        </View>
        <TouchableOpacity style={styles.notifBtn} onPress={() => navigation.navigate('Notifications')}>
          <View style={styles.notifIconContainer}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            {unreadCount > 0 && (
              <View style={styles.notifBadgeMini}>
                <Text style={styles.notifBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet */}
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
            <TouchableOpacity style={styles.routeInputTouch} onPress={() => setCityModal('from')}>
              <Text style={[styles.routeInput, !fromCity && styles.routeInputPlaceholder]}>
                {fromCity || 'Leaving From'}
              </Text>
            </TouchableOpacity>
            <View style={styles.routeInputDivider} />
            <TouchableOpacity style={styles.routeInputTouch} onPress={() => setCityModal('to')}>
              <Text style={[styles.routeInput, !toCity && styles.routeInputPlaceholder]}>
                {toCity || 'Going To'}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={swapCities} style={styles.swapBtn}>
            <Ionicons name="swap-vertical" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Date Row */}
        <View style={styles.dateRow}>
          <TouchableOpacity
            style={[styles.datePill, !selectedDate && styles.datePillActive]}
            onPress={() => setSelectedDate(null)}
          >
            <Text style={[styles.datePillText, !selectedDate && styles.datePillActiveText]}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.datePill, !!selectedDate && styles.datePillActive]}
            onPress={() => setScheduleModal(true)}
          >
            <Ionicons name="calendar-outline" size={13} color={selectedDate ? '#fff' : COLORS.gray} />
            <Text style={[styles.datePillText, !!selectedDate && styles.datePillActiveText]}>
              {selectedDate ? displayDate : 'Pick Date'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Find Rides Button */}
        <TouchableOpacity onPress={handleFindRide} activeOpacity={0.85}>
          <LinearGradient colors={GRADIENTS.primary as any} style={styles.findBtn}>
            <Text style={styles.findBtnText}>Find Ride</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

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
              <TouchableOpacity onPress={() => setScheduleModal(false)} style={styles.modalClose}>
                <Ionicons name="close" size={22} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={UPCOMING_DATES}
              keyExtractor={item => item.value}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => {
                const isSel = selectedDate === item.value;
                return (
                  <TouchableOpacity
                    style={[styles.dateItem, isSel && styles.dateItemActive]}
                    onPress={() => { setSelectedDate(item.value); setScheduleModal(false); }}
                    activeOpacity={0.7}
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
                  </TouchableOpacity>
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
  container:    { flex: 1, backgroundColor: '#e8f0e8' },
  mapSection:   { flex: 1 },
  topBar: {
    position: 'absolute', top: Platform.OS === 'ios' ? 52 : 40,
    left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 10,
  },
  topCenter: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 8, gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4,
  },
  locationText: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  notifBtn: { position: 'relative' },
  notifIconContainer: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
  },
  notifBadgeMini: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: COLORS.danger, borderRadius: 9, minWidth: 18, height: 18,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff',
  },
  notifBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  bottomSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 110 : 100,
    shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 20,
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:  { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 16 },
  routeCard:   { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 16, padding: 14, marginBottom: 12, gap: 12 },
  routeLeft:   { alignItems: 'center', gap: 3 },
  routeDot:    { width: 10, height: 10, borderRadius: 5 },
  routeVertLine: { width: 2, height: 22, backgroundColor: COLORS.border },
  routeInputs: { flex: 1 },
  routeInputTouch: { paddingVertical: 6 },
  routeInput:  { fontSize: 14, fontWeight: '500', color: COLORS.textPrimary },
  routeInputPlaceholder: { color: COLORS.gray },
  routeInputDivider: { height: 1, backgroundColor: COLORS.border },
  swapBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  dateRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  datePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border },
  datePillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  datePillText: { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  datePillActiveText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  findBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 16, gap: 8, marginBottom: 16 },
  findBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet:   { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, maxHeight: '75%' },
  modalHandle:  { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, marginBottom: 8 },
  modalTitle:   { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  modalClose:   { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.lightGray, alignItems: 'center', justifyContent: 'center' },
  dateItem:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, gap: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  dateItemActive: { backgroundColor: '#eff6ff' },
  dateIcon:     { width: 40, height: 40, borderRadius: 12, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  dateIconActive: { backgroundColor: COLORS.primary },
  dateLabelWrap: { flex: 1 },
  dateLabel:    { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  dateValue:    { fontSize: 12, color: COLORS.gray, marginTop: 2 },
});
