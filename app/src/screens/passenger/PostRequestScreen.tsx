import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CURVE, AppBar, PrimaryButton, DatePickerInput, TimePickerInput } from '../../components';
import CitySearchModal from '../../components/CitySearchModal';
import { useToast } from '../../context/ToastContext';
import { scheduleRequestsApi } from '../../services/api';
import { haptics } from '../../utils/haptics';
import { parseApiError } from '../../utils/errorMessages';

export default function PostRequestScreen({ navigation, route }: any) {
  const { showToast } = useToast();

  const maxDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [from, setFrom]   = useState('');
  const [to, setTo]       = useState('');
  const [seats, setSeats] = useState(1);
  const [departureTime, setDepartureTime] = useState('');
  const [rideType, setRideType] = useState<'oneway' | 'roundtrip'>('oneway');
  const [note, setNote]   = useState('');
  const [posting, setPosting]   = useState(false);
  const [cityModal, setCityModal] = useState<'from' | 'to' | null>(null);

  // Pre-fill from route params (Re-post feature)
  React.useEffect(() => {
    const p = route?.params;
    if (p) {
      if (p.from) setFrom(p.from);
      if (p.to)   setTo(p.to);
      if (p.seats) setSeats(p.seats);
      if (p.departureTime) setDepartureTime(p.departureTime);
      if (p.note) setNote(p.note);
      showToast('Details pre-filled from your previous request', 'info');
    }
  }, [route?.params]);

  const handlePost = async () => {
    if (!selectedDate) { showToast('Please select a date', 'warning'); return; }
    if (!from)         { showToast('Please select departure city', 'warning'); return; }
    if (!to)           { showToast('Please select destination city', 'warning'); return; }
    if (from === to)   { showToast('Cities cannot be the same', 'error'); return; }
    if (!departureTime.trim()) { showToast('Please select your preferred departure time', 'warning'); return; }

    setPosting(true);
    const { error } = await scheduleRequestsApi.create({
      fromCity: from, toCity: to, date: selectedDate, departureTime: departureTime.trim(), seats,
      note: note.trim() || undefined,
    });
    setPosting(false);

    if (error) {
      showToast(parseApiError(error), 'error');
    } else {
      haptics.success();
      showToast('Request posted! Drivers will send offers soon.', 'success', 4000);
      setSelectedDate(null); setFrom(''); setTo(''); setSeats(1); setDepartureTime(''); setNote('');
      navigation.navigate('MyRequests');
    }
  };

  return (
    <View style={styles.container}>
      <AppBar title="Post Request" onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        <View style={styles.card}>
          {/* Route */}
          <Pressable style={styles.cityField} onPress={() => setCityModal('from')}>
            <View style={[styles.cityDot, { backgroundColor: COLORS.primary }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>From</Text>
              <Text style={[styles.cityText, !from && styles.placeholder]}>{from || 'Departure City'}</Text>
            </View>
            <Ionicons name="chevron-down" size={15} color={COLORS.gray} />
          </Pressable>

          <View style={styles.swapRow}>
            <Pressable style={styles.swapBtn} onPress={() => { const t = from; setFrom(to); setTo(t); }}>
              <Ionicons name="swap-vertical" size={18} color={COLORS.primary} />
            </Pressable>
          </View>

          <Pressable style={styles.cityField} onPress={() => setCityModal('to')}>
            <View style={[styles.cityDot, { backgroundColor: COLORS.danger }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>To</Text>
              <Text style={[styles.cityText, !to && styles.placeholder]}>{to || 'Destination City'}</Text>
            </View>
            <Ionicons name="chevron-down" size={15} color={COLORS.gray} />
          </Pressable>

          {/* Date / Time */}
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <DatePickerInput label="Date" value={selectedDate} onChange={setSelectedDate} minDate={new Date()} maxDate={maxDate} placeholder="Select date" />
            </View>
            <View style={{ flex: 1 }}>
              <TimePickerInput label="Time" value={departureTime || null} onChange={setDepartureTime} placeholder="Select time" />
            </View>
          </View>

          {/* Seats */}
          <View style={styles.seatsRow}>
            <Text style={styles.fieldLabelStandalone}>Seats Needed</Text>
            <View style={styles.stepperRow}>
              <Pressable
                style={[styles.stepperBtn, seats <= 1 && styles.stepperBtnDisabled]}
                disabled={seats <= 1}
                onPress={() => setSeats(s => Math.max(1, s - 1))}
              >
                <Ionicons name="remove" size={18} color={seats <= 1 ? COLORS.gray : COLORS.primary} />
              </Pressable>
              <Text style={styles.seatsValue}>{seats} Seat{seats !== 1 ? 's' : ''}</Text>
              <Pressable
                style={[styles.stepperBtn, seats >= 6 && styles.stepperBtnDisabled]}
                disabled={seats >= 6}
                onPress={() => setSeats(s => Math.min(6, s + 1))}
              >
                <Ionicons name="add" size={18} color={seats >= 6 ? COLORS.gray : COLORS.primary} />
              </Pressable>
            </View>
          </View>

          {/* Ride Type */}
          <Text style={styles.fieldLabelStandalone}>Ride Type</Text>
          <View style={styles.rideTypeRow}>
            <Pressable
              style={[styles.rideTypeBtn, rideType === 'oneway' && styles.rideTypeBtnActive]}
              onPress={() => setRideType('oneway')}
            >
              <Ionicons name="arrow-forward-circle-outline" size={16} color={rideType === 'oneway' ? COLORS.primary : COLORS.textSecondary} />
              <Text style={[styles.rideTypeText, rideType === 'oneway' && styles.rideTypeTextActive]}>One Way</Text>
            </Pressable>
            <Pressable
              style={styles.rideTypeBtn}
              onPress={() => showToast('Round trip requests are coming soon', 'info')}
            >
              <Text style={styles.rideTypeText}>Round Trip</Text>
            </Pressable>
          </View>

          {/* Note */}
          <Text style={[styles.fieldLabelStandalone, { marginTop: 16 }]}>Additional Notes (Optional)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Any additional information for drivers..."
            placeholderTextColor={COLORS.gray}
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={200}
          />
        </View>

        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Drivers will see your request and send offers with their price. Accept the best offer and a ride will be instantly created with your seat confirmed.
          </Text>
        </View>

        <PrimaryButton title="Post Request" onPress={handlePost} loading={posting} style={styles.postBtn} />
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
  body:           { paddingHorizontal: 16, paddingBottom: 32 },
  card: {
    backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: 'rgba(15, 23, 42, 0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 16, elevation: 2,
    ...CURVE,
  },
  cityField:      { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.lightGray, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  cityDot:        { width: 8, height: 8, borderRadius: 4 },
  fieldLabel:     { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 2 },
  fieldLabelStandalone: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 10 },
  cityText:       { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  placeholder:    { color: COLORS.gray, fontWeight: '400' },
  swapRow:        { alignItems: 'flex-end', marginTop: -20, marginBottom: 4, marginRight: 4 },
  swapBtn:        { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  row:            { flexDirection: 'row', gap: 12 },
  seatsRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.lightGray, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16 },
  stepperRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepperBtn:     { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  stepperBtnDisabled: { opacity: 0.5 },
  seatsValue:     { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, minWidth: 60, textAlign: 'center' },
  rideTypeRow:    { flexDirection: 'row', gap: 10, marginBottom: 4 },
  rideTypeBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, paddingVertical: 12 },
  rideTypeBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  rideTypeText:   { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  rideTypeTextActive: { color: COLORS.primary, fontWeight: '700' },
  noteInput:      { backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 12, fontSize: 13, color: COLORS.textPrimary, textAlignVertical: 'top', minHeight: 70 },
  infoBanner:     { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.primaryLight, borderRadius: 14, padding: 14, gap: 10, marginTop: 16, marginBottom: 20 },
  infoText:       { flex: 1, fontSize: 13, color: COLORS.primaryDark, lineHeight: 20 },
  postBtn:        { marginTop: 0 },
});
