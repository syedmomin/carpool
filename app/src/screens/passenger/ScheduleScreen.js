import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, FlatList, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, GradientHeader, PrimaryButton, EmptyState } from '../../components';
import { SvgXml } from 'react-native-svg';
import { scheduleIllustration } from '../../components/IllustrationAssets';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { CITIES } from '../../data/mockData';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function buildCalendar(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

function fmt(year, month, day) {
  return `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

export default function ScheduleScreen({ navigation }) {
  const { addScheduleAlert, removeScheduleAlert, scheduleAlerts } = useApp();
  const { showToast } = useToast();

  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [from, setFrom]   = useState('');
  const [to,   setTo]     = useState('');
  const [cityModal, setCityModal] = useState(null); // 'from' | 'to'

  const cells = useMemo(() => buildCalendar(viewYear, viewMonth), [viewYear, viewMonth]);

  const maxDate = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());

  const isDisabled = (day) => {
    if (!day) return true;
    const d = new Date(viewYear, viewMonth, day);
    return d < new Date(today.getFullYear(), today.getMonth(), today.getDate()) || d > maxDate;
  };

  const hasAlert = (day) => {
    if (!day) return false;
    const dateStr = fmt(viewYear, viewMonth, day);
    return (scheduleAlerts || []).some(a => a.date === dateStr);
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    const nm = viewMonth === 11 ? 0 : viewMonth + 1;
    const ny = viewMonth === 11 ? viewYear + 1 : viewYear;
    if (new Date(ny, nm, 1) > new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)) return;
    setViewMonth(nm); if (viewMonth === 11) setViewYear(y => y + 1);
  };

  const handleSetAlert = () => {
    if (!selectedDate) { showToast('Please select a date from the calendar', 'warning'); return; }
    if (!from)         { showToast('Please select departure city', 'warning'); return; }
    if (!to)           { showToast('Please select destination city', 'warning'); return; }
    if (from === to)   { showToast('Departure and destination cannot be the same', 'error'); return; }

    addScheduleAlert({ date: selectedDate, from, to });
    showToast(`Alert set! You'll be notified when a ${from} → ${to} ride is posted on ${selectedDate}.`, 'success', 5000);
    setSelectedDate(null);
    setFrom('');
    setTo('');
  };

  const handleRemoveAlert = (id) => {
    removeScheduleAlert(id);
    showToast('Ride alert removed', 'info');
  };

  const isPrevDisabled = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const isNextDisabled = viewYear === maxDate.getFullYear() && viewMonth === maxDate.getMonth();

  return (
    <View style={styles.container}>
      <GradientHeader
        colors={GRADIENTS.primary}
        title="Schedule a Ride"
        subtitle="Set alerts for upcoming routes"
        onBack={() => navigation.goBack()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Illustration */}
        <View style={styles.illustrationWrap}>
          <SvgXml xml={scheduleIllustration} width={260} height={180} />
        </View>

        {/* Calendar Card */}
        <View style={styles.calendarCard}>
          {/* Month Header */}
          <View style={styles.monthHeader}>
            <TouchableOpacity
              onPress={prevMonth}
              disabled={isPrevDisabled}
              style={[styles.monthArrow, isPrevDisabled && styles.monthArrowDisabled]}
            >
              <Ionicons name="chevron-back" size={20} color={isPrevDisabled ? COLORS.border : COLORS.primary} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{MONTHS[viewMonth]} {viewYear}</Text>
            <TouchableOpacity
              onPress={nextMonth}
              disabled={isNextDisabled}
              style={[styles.monthArrow, isNextDisabled && styles.monthArrowDisabled]}
            >
              <Ionicons name="chevron-forward" size={20} color={isNextDisabled ? COLORS.border : COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Day labels */}
          <View style={styles.daysRow}>
            {DAYS.map(d => (
              <Text key={d} style={[styles.dayLabel, d === 'Sun' && { color: COLORS.danger }]}>{d}</Text>
            ))}
          </View>

          {/* Date grid */}
          <View style={styles.grid}>
            {cells.map((day, idx) => {
              if (!day) return <View key={`e${idx}`} style={styles.cell} />;
              const dateStr   = fmt(viewYear, viewMonth, day);
              const disabled  = isDisabled(day);
              const isToday   = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
              const isSelected = dateStr === selectedDate;
              const alertOn   = hasAlert(day);

              return (
                <TouchableOpacity
                  key={dateStr}
                  style={styles.cell}
                  onPress={() => !disabled && setSelectedDate(dateStr)}
                  disabled={disabled}
                  activeOpacity={0.7}
                >
                  {isSelected ? (
                    <LinearGradient colors={GRADIENTS.primary} style={styles.cellSelected}>
                      <Text style={styles.cellTextSelected}>{day}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={[
                      styles.cellInner,
                      isToday && styles.cellToday,
                      disabled && styles.cellDisabled,
                    ]}>
                      <Text style={[
                        styles.cellText,
                        isToday    && styles.cellTextToday,
                        disabled   && styles.cellTextDisabled,
                        (idx % 7 === 0) && !disabled && { color: COLORS.danger },
                      ]}>{day}</Text>
                      {alertOn && <View style={styles.alertDot} />}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedDate && (
            <View style={styles.selectedDateBanner}>
              <Ionicons name="calendar" size={15} color={COLORS.primary} />
              <Text style={styles.selectedDateText}>Selected: {selectedDate}</Text>
              <TouchableOpacity onPress={() => setSelectedDate(null)}>
                <Ionicons name="close-circle" size={16} color={COLORS.gray} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Route Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Route</Text>
          <View style={styles.routeRow}>
            <TouchableOpacity
              style={styles.cityBtn}
              onPress={() => setCityModal('from')}
            >
              <View style={[styles.cityDot, { backgroundColor: COLORS.primary }]} />
              <Text style={[styles.cityBtnText, !from && styles.placeholder]}>{from || 'Departure City'}</Text>
              <Ionicons name="chevron-down" size={15} color={COLORS.gray} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.swapBtn}
              onPress={() => { const t = from; setFrom(to); setTo(t); }}
            >
              <Ionicons name="swap-vertical" size={18} color={COLORS.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cityBtn}
              onPress={() => setCityModal('to')}
            >
              <View style={[styles.cityDot, { backgroundColor: COLORS.secondary }]} />
              <Text style={[styles.cityBtnText, !to && styles.placeholder]}>{to || 'Destination City'}</Text>
              <Ionicons name="chevron-down" size={15} color={COLORS.gray} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
          <Text style={styles.infoText}>
            You'll receive a notification the moment a driver posts a ride matching your selected route and date.
          </Text>
        </View>

        {/* Set Alert Button */}
        <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
          <PrimaryButton
            title="Set Ride Alert"
            icon="notifications-outline"
            onPress={handleSetAlert}
            colors={GRADIENTS.primary}
          />
        </View>

        {/* Saved Alerts */}
        {(scheduleAlerts?.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Saved Alerts ({scheduleAlerts.length})</Text>
            {scheduleAlerts.map(alert => (
              <View key={alert.id} style={styles.alertCard}>
                <LinearGradient colors={['#eff6ff', '#e8f4fd']} style={styles.alertCardGrad}>
                  <View style={styles.alertLeft}>
                    <View style={styles.alertIconBox}>
                      <Ionicons name="notifications" size={18} color={COLORS.primary} />
                    </View>
                    <View>
                      <Text style={styles.alertRoute}>{alert.from} → {alert.to}</Text>
                      <Text style={styles.alertDate}>{alert.date}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveAlert(alert.id)}
                    style={styles.alertDeleteBtn}
                  >
                    <Ionicons name="close-circle" size={22} color={COLORS.danger} />
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            ))}
          </View>
        )}

        {(scheduleAlerts?.length === 0) && (
          <View style={styles.noAlertsWrap}>
            <Text style={styles.noAlertsText}>No alerts set yet. Pick a date and route above!</Text>
          </View>
        )}
      </ScrollView>

      {/* City Picker Modal */}
      <Modal visible={!!cityModal} animationType="slide" onRequestClose={() => setCityModal(null)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{cityModal === 'from' ? 'Departure City' : 'Destination City'}</Text>
            <TouchableOpacity onPress={() => setCityModal(null)} style={styles.modalClose}>
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={CITIES}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.cityItem}
                onPress={() => {
                  cityModal === 'from' ? setFrom(item) : setTo(item);
                  setCityModal(null);
                }}
              >
                <Ionicons name="location-outline" size={18} color={COLORS.primary} />
                <Text style={styles.cityItemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.bg },
  illustrationWrap: { alignItems: 'center', paddingTop: 20, paddingBottom: 8 },

  calendarCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  monthHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  monthArrow:   { width: 36, height: 36, borderRadius: 10, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  monthArrowDisabled: { backgroundColor: COLORS.lightGray },
  monthTitle:   { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },

  daysRow:  { flexDirection: 'row', marginBottom: 8 },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700', color: COLORS.gray },

  grid:     { flexDirection: 'row', flexWrap: 'wrap' },
  cell:     { width: `${100/7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
  cellInner: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17 },
  cellSelected: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  cellToday: { backgroundColor: '#eff6ff', borderWidth: 1.5, borderColor: COLORS.primary },
  cellDisabled: {},
  cellText: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  cellTextSelected: { fontSize: 13, fontWeight: '800', color: '#fff' },
  cellTextToday: { color: COLORS.primary, fontWeight: '800' },
  cellTextDisabled: { color: COLORS.border },
  alertDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: COLORS.secondary, position: 'absolute', bottom: 3 },

  selectedDateBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#eff6ff', borderRadius: 10, padding: 10, marginTop: 12,
  },
  selectedDateText: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.primary },

  section:      { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },

  routeRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cityBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 13, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  cityDot:   { width: 8, height: 8, borderRadius: 4 },
  cityBtnText: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  placeholder: { color: COLORS.gray, fontWeight: '400' },
  swapBtn:   { padding: 8, backgroundColor: '#eff6ff', borderRadius: 10 },

  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#eff6ff', borderRadius: 14, marginHorizontal: 16, padding: 14, gap: 10, marginBottom: 20 },
  infoText:   { flex: 1, fontSize: 13, color: COLORS.primary, lineHeight: 20 },

  alertCard: { borderRadius: 14, overflow: 'hidden', marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  alertCardGrad: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  alertLeft:  { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  alertIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  alertRoute: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  alertDate:  { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  alertDeleteBtn: { padding: 4 },

  noAlertsWrap: { alignItems: 'center', paddingVertical: 12 },
  noAlertsText: { fontSize: 13, color: COLORS.gray, fontStyle: 'italic' },

  modal: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 55, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle:  { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  modalClose:  { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.lightGray, alignItems: 'center', justifyContent: 'center' },
  cityItem:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 12 },
  cityItemText: { fontSize: 16, color: COLORS.textPrimary },
});
