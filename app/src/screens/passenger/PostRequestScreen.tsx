import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, GradientHeader, PrimaryButton } from '../../components';
import CitySearchModal from '../../components/CitySearchModal';
import { useToast } from '../../context/ToastContext';
import { scheduleRequestsApi } from '../../services/api';

// ─── Calendar helpers ──────────────────────────────────────────────────────────
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function buildCalendar(year: number, month: number) {
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

function fmt(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

const SEAT_OPTIONS = [1, 2, 3, 4, 5, 6];

export default function PostRequestScreen({ navigation }) {
  const { showToast } = useToast();

  const today    = new Date();
  const maxDate  = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());

  const [viewYear, setViewYear]     = useState(today.getFullYear());
  const [viewMonth, setViewMonth]   = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [from, setFrom]   = useState('');
  const [to, setTo]       = useState('');
  const [seats, setSeats] = useState(1);
  const [departureTime, setDepartureTime] = useState('');
  const [note, setNote]   = useState('');
  const [posting, setPosting]   = useState(false);
  const [cityModal, setCityModal] = useState<'from' | 'to' | null>(null);

  const cells = useMemo(() => buildCalendar(viewYear, viewMonth), [viewYear, viewMonth]);

  const isDisabled = (day: number | null) => {
    if (!day) return true;
    const d = new Date(viewYear, viewMonth, day);
    return d < new Date(today.getFullYear(), today.getMonth(), today.getDate()) || d > maxDate;
  };

  const isPrevDisabled = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const isNextDisabled = viewYear === maxDate.getFullYear() && viewMonth === maxDate.getMonth();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    const nm = viewMonth === 11 ? 0 : viewMonth + 1;
    const ny = viewMonth === 11 ? viewYear + 1 : viewYear;
    if (new Date(ny, nm, 1) > new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)) return;
    setViewMonth(nm);
    if (viewMonth === 11) setViewYear(y => y + 1);
  };

  const handlePost = async () => {
    if (!selectedDate) { showToast('Please select a date', 'warning'); return; }
    if (!from)         { showToast('Please select departure city', 'warning'); return; }
    if (!to)           { showToast('Please select destination city', 'warning'); return; }
    if (from === to)   { showToast('Cities cannot be the same', 'error'); return; }
    if (!departureTime.trim()) { showToast('Please enter your preferred departure time', 'warning'); return; }
    const timeReg = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeReg.test(departureTime.trim())) { showToast('Enter time in HH:MM format (e.g. 08:30)', 'warning'); return; }

    setPosting(true);
    const { error } = await scheduleRequestsApi.create({
      fromCity: from, toCity: to, date: selectedDate, departureTime: departureTime.trim(), seats,
      note: note.trim() || undefined,
    });
    setPosting(false);

    if (error) { showToast(error, 'error'); return; }

    showToast('Request posted! Drivers will bid soon.', 'success', 4000);
    setSelectedDate(null); setFrom(''); setTo(''); setSeats(1); setDepartureTime(''); setNote('');
    // Navigate to My Requests tab
    navigation.navigate('MyRequests');
  };

  return (
    <View style={styles.container}>
      <GradientHeader
        colors={GRADIENTS.primary as any}
        title="Post a Request"
        subtitle="Drivers will bid with their price"
        onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Calendar */}
        <View style={styles.calendarCard}>
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={prevMonth} disabled={isPrevDisabled}
              style={[styles.monthArrow, isPrevDisabled && styles.monthArrowDisabled]}>
              <Ionicons name="chevron-back" size={20} color={isPrevDisabled ? COLORS.border : COLORS.primary} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{MONTHS[viewMonth]} {viewYear}</Text>
            <TouchableOpacity onPress={nextMonth} disabled={isNextDisabled}
              style={[styles.monthArrow, isNextDisabled && styles.monthArrowDisabled]}>
              <Ionicons name="chevron-forward" size={20} color={isNextDisabled ? COLORS.border : COLORS.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.daysRow}>
            {DAYS.map(d => <Text key={d} style={[styles.dayLabel, d === 'Sun' && { color: COLORS.danger }]}>{d}</Text>)}
          </View>
          <View style={styles.grid}>
            {cells.map((day, idx) => {
              if (!day) return <View key={`e${idx}`} style={styles.cell} />;
              const dateStr  = fmt(viewYear, viewMonth, day);
              const disabled = isDisabled(day);
              const isToday  = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
              const isSel    = dateStr === selectedDate;
              return (
                <TouchableOpacity key={dateStr} style={styles.cell}
                  onPress={() => !disabled && setSelectedDate(dateStr)}
                  disabled={disabled} activeOpacity={0.7}>
                  {isSel ? (
                    <LinearGradient colors={GRADIENTS.primary as any} style={styles.cellSel}>
                      <Text style={styles.cellTextSel}>{day}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.cellInner, isToday && styles.cellToday, disabled && styles.cellDisabled]}>
                      <Text style={[styles.cellText,
                        isToday && styles.cellTextToday,
                        disabled && styles.cellTextDisabled,
                        (idx % 7 === 0) && !disabled && { color: COLORS.danger }
                      ]}>{day}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          {selectedDate && (
            <View style={styles.selectedBanner}>
              <Ionicons name="calendar" size={15} color={COLORS.primary} />
              <Text style={styles.selectedText}>Selected: {selectedDate}</Text>
              <TouchableOpacity onPress={() => setSelectedDate(null)}>
                <Ionicons name="close-circle" size={16} color={COLORS.gray} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Route */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route</Text>
          <View style={styles.routeRow}>
            <TouchableOpacity style={styles.cityBtn} onPress={() => setCityModal('from')}>
              <View style={[styles.cityDot, { backgroundColor: COLORS.primary }]} />
              <Text style={[styles.cityBtnText, !from && styles.placeholder]}>{from || 'Departure City'}</Text>
              <Ionicons name="chevron-down" size={15} color={COLORS.gray} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.swapBtn} onPress={() => { const t = from; setFrom(to); setTo(t); }}>
              <Ionicons name="swap-vertical" size={18} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.cityBtn} onPress={() => setCityModal('to')}>
              <View style={[styles.cityDot, { backgroundColor: COLORS.secondary }]} />
              <Text style={[styles.cityBtnText, !to && styles.placeholder]}>{to || 'Destination City'}</Text>
              <Ionicons name="chevron-down" size={15} color={COLORS.gray} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Seats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seats Needed</Text>
          <View style={styles.seatsRow}>
            {SEAT_OPTIONS.map(n => (
              <TouchableOpacity key={n} style={[styles.seatChip, seats === n && styles.seatChipActive]}
                onPress={() => setSeats(n)}>
                <Text style={[styles.seatChipText, seats === n && styles.seatChipTextActive]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Departure Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred Departure Time</Text>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={20} color={COLORS.primary} />
            <TextInput
              style={styles.timeInput}
              placeholder="08:30"
              placeholderTextColor={COLORS.gray}
              value={departureTime}
              onChangeText={v => {
                let val = v.replace(/[^0-9]/g, '');
                if (val.length >= 3) val = val.slice(0, 2) + ':' + val.slice(2, 4);
                setDepartureTime(val);
              }}
              keyboardType="number-pad"
              maxLength={5}
            />
            <Text style={styles.timeHint}>HH:MM (24-hr)</Text>
          </View>
        </View>

        {/* Note */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Note for Driver <Text style={styles.optional}>(optional)</Text></Text>
          <TextInput
            style={styles.noteInput}
            placeholder="E.g. Need pickup from main bus stop, luggage to carry..."
            placeholderTextColor={COLORS.gray}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
            maxLength={200}
          />
        </View>

        {/* Info */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Drivers will see your request and bid with their price. Accept the best offer — a ride will be instantly created and your seat confirmed.
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
          <PrimaryButton
            title={posting ? 'Posting...' : 'Post Request'}
            icon="send-outline"
            onPress={handlePost}
            colors={GRADIENTS.primary as any}
            disabled={posting}
          />
        </View>
      </ScrollView>

      <CitySearchModal visible={cityModal === 'from'} title="Departure City"
        onSelect={name => { setFrom(name); setCityModal(null); }} onClose={() => setCityModal(null)} />
      <CitySearchModal visible={cityModal === 'to'} title="Destination City"
        onSelect={name => { setTo(name); setCityModal(null); }} onClose={() => setCityModal(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.bg },
  calendarCard:   { backgroundColor: '#fff', borderRadius: 20, marginHorizontal: 16, marginBottom: 16, padding: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10 },
  monthHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  monthArrow:     { width: 36, height: 36, borderRadius: 10, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  monthArrowDisabled: { backgroundColor: COLORS.lightGray },
  monthTitle:     { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  daysRow:        { flexDirection: 'row', marginBottom: 8 },
  dayLabel:       { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700', color: COLORS.gray },
  grid:           { flexDirection: 'row', flexWrap: 'wrap' },
  cell:           { width: `${100/7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
  cellInner:      { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17 },
  cellSel:        { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  cellToday:      { backgroundColor: '#eff6ff', borderWidth: 1.5, borderColor: COLORS.primary },
  cellDisabled:   {},
  cellText:       { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  cellTextSel:    { fontSize: 13, fontWeight: '800', color: '#fff' },
  cellTextToday:  { color: COLORS.primary, fontWeight: '800' },
  cellTextDisabled: { color: COLORS.border },
  selectedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#eff6ff', borderRadius: 10, padding: 10, marginTop: 12 },
  selectedText:   { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.primary },
  section:        { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle:   { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 10 },
  optional:       { fontSize: 12, fontWeight: '400', color: COLORS.gray },
  routeRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cityBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 13, gap: 8, elevation: 1 },
  cityDot:        { width: 8, height: 8, borderRadius: 4 },
  cityBtnText:    { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  placeholder:    { color: COLORS.gray, fontWeight: '400' },
  swapBtn:        { padding: 8, backgroundColor: '#eff6ff', borderRadius: 10 },
  seatsRow:       { flexDirection: 'row', gap: 10 },
  seatChip:       { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  seatChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  seatChipText:   { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  seatChipTextActive: { color: '#fff' },
  timeRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 13 },
  timeInput:      { flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  timeHint:       { fontSize: 11, color: COLORS.gray },
  noteInput:      { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, padding: 14, fontSize: 14, color: COLORS.textPrimary, textAlignVertical: 'top', minHeight: 80 },
  infoBanner:     { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#eff6ff', borderRadius: 14, marginHorizontal: 16, padding: 14, gap: 10, marginBottom: 20 },
  infoText:       { flex: 1, fontSize: 13, color: COLORS.primary, lineHeight: 20 },
});
