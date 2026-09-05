import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CURVE, AppBar, PrimaryButton, DatePickerInput, TimePickerInput, PickupPinPicker } from '../../components';
import CitySearchModal from '../../components/CitySearchModal';
import { useToast } from '../../context/ToastContext';
import { useGlobalModal } from '../../context/GlobalModalContext';
import { scheduleRequestsApi } from '../../services/api';
import { haptics } from '../../utils/haptics';
import { parseApiError } from '../../utils/errorMessages';
import { to24Hour, formatLocalDate } from '../../utils/date';
import { generateLocalId } from '../../utils/id';

// Adds N days to a YYYY-MM-DD string, returning the same format.
function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return formatLocalDate(dt);
}

export default function PostRequestScreen({ navigation, route }: any) {
  const { showToast } = useToast();
  const { showModal } = useGlobalModal();

  const maxDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [from, setFrom]   = useState('');
  const [to, setTo]       = useState('');
  const [seats, setSeats] = useState(1);
  const [departureTime, setDepartureTime] = useState('');
  const [pickupLat, setPickupLat] = useState<number | undefined>(undefined);
  const [pickupLng, setPickupLng] = useState<number | undefined>(undefined);
  const [pickupAddress, setPickupAddress] = useState<string | undefined>(undefined);
  const [rideType, setRideType] = useState<'oneway' | 'roundtrip'>('oneway');
  const [returnDate, setReturnDate] = useState<string | null>(null);
  const [returnDepartureTime, setReturnDepartureTime] = useState('');
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
    if (!from)         { showToast('Please select a departure city', 'warning'); return; }
    if (!to)           { showToast('Please select a destination city', 'warning'); return; }
    if (from === to)   { showToast('Cities cannot be the same', 'error'); return; }
    if (!departureTime.trim()) { showToast('Please select a departure time', 'warning'); return; }
    if (pickupLat == null || pickupLng == null) { showToast('Please set your exact pickup point on the map', 'warning'); return; }

    const departureTime24 = to24Hour(departureTime.trim());

    if (rideType === 'roundtrip') {
      if (!returnDate) { showToast('Please select a return date', 'warning'); return; }
      if (!returnDepartureTime.trim()) { showToast('Please select a return time', 'warning'); return; }
      if (returnDate < selectedDate) { showToast('Return date cannot be before the departure date', 'error'); return; }
      const returnTime24 = to24Hour(returnDepartureTime.trim());
      if (returnDate === selectedDate && returnTime24 <= departureTime24) {
        showToast('Return time must be later than your departure time on the same day', 'error');
        return;
      }
    }

    if (rideType === 'roundtrip') {
      const returnTime24 = to24Hour(returnDepartureTime.trim());
      showModal({
        type: 'primary',
        title: 'Confirm Both Legs',
        message:
          `Outbound: ${from} → ${to}\n${selectedDate}, ${departureTime24}\n\n` +
          `Return: ${to} → ${from}\n${returnDate}, ${returnTime24}`,
        confirmText: 'Post Both Requests',
        cancelText: 'Edit',
        icon: 'swap-horizontal-outline',
        onConfirm: () => doPost(departureTime24),
      });
      return;
    }

    doPost(departureTime24);
  };

  const doPost = async (departureTime24: string) => {
    setPosting(true);
    const roundTripGroupId = rideType === 'roundtrip' ? generateLocalId() : undefined;

    const { error } = await scheduleRequestsApi.create({
      fromCity: from, toCity: to, date: selectedDate as string, departureTime: departureTime24, seats,
      note: note.trim() || undefined,
      ...(roundTripGroupId ? { roundTripGroupId } : {}),
      ...(pickupLat != null && pickupLng != null ? { fromLat: pickupLat, fromLng: pickupLng } : {}),
      ...(pickupAddress ? { fromAddress: pickupAddress } : {}),
    });

    if (error) {
      setPosting(false);
      showToast(parseApiError(error), 'error');
      return;
    }

    if (rideType === 'roundtrip') {
      const returnTime24 = to24Hour(returnDepartureTime.trim());
      const { error: returnError } = await scheduleRequestsApi.create({
        fromCity: to, toCity: from, date: returnDate as string, departureTime: returnTime24, seats,
        note: note.trim() || undefined,
        roundTripGroupId,
      });
      setPosting(false);
      if (returnError) {
        haptics.success();
        showToast(`Outbound request posted, but the return leg failed: ${parseApiError(returnError)}`, 'warning');
        setSelectedDate(null); setFrom(''); setTo(''); setSeats(1); setDepartureTime(''); setNote('');
        setReturnDate(null); setReturnDepartureTime(''); setRideType('oneway'); setPickupLat(undefined); setPickupLng(undefined); setPickupAddress(undefined);
        navigation.navigate('MyRequests');
        return;
      }
    } else {
      setPosting(false);
    }

    haptics.success();
    showToast(
      rideType === 'roundtrip' ? 'Both requests posted! Drivers will send offers soon.' : 'Request posted! Drivers will send offers soon.',
      'success', 4000,
    );
    setSelectedDate(null); setFrom(''); setTo(''); setSeats(1); setDepartureTime(''); setNote('');
    setReturnDate(null); setReturnDepartureTime(''); setRideType('oneway'); setPickupLat(undefined); setPickupLng(undefined); setPickupAddress(undefined);
    navigation.navigate('MyRequests');
  };

  return (
    <View style={styles.container}>
      <AppBar title="Post Request" onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        <View style={styles.card}>
          {/* Route */}
          <View style={styles.routeCard}>
            <View style={styles.routeLeft}>
              <View style={[styles.routeDot, { backgroundColor: COLORS.primary }]} />
              <View style={styles.routeVertLine} />
              <View style={[styles.routeDot, { backgroundColor: COLORS.danger }]} />
            </View>
            <View style={styles.routeInputs}>
              <Pressable style={styles.routeInputTouch} onPress={() => setCityModal('from')}>
                <Text style={[styles.routeInput, !from && styles.routeInputPlaceholder]} numberOfLines={1}>
                  {from || 'Departure City'}
                </Text>
              </Pressable>
              <View style={styles.routeInputDivider} />
              <Pressable style={styles.routeInputTouch} onPress={() => setCityModal('to')}>
                <Text style={[styles.routeInput, !to && styles.routeInputPlaceholder]} numberOfLines={1}>
                  {to || 'Destination City'}
                </Text>
              </Pressable>
            </View>
            <Pressable onPress={() => { const t = from; setFrom(to); setTo(t); }} style={styles.swapBtn}>
              <Ionicons name="swap-vertical" size={18} color={COLORS.primary} />
            </Pressable>
          </View>

          {/* Exact Pickup Point (optional) */}
          {!!from && (
            <>
              <Text style={styles.pinHint}>
                <Ionicons name="information-circle-outline" size={13} color={COLORS.gray} /> Pin your exact pickup spot in {from} so your driver can find you. This is required.
              </Text>
              <View style={{ marginBottom: 16 }}>
                <PickupPinPicker
                  onLocationChange={(lat, lng) => { setPickupLat(lat); setPickupLng(lng); }}
                  onAddressChange={(address) => setPickupAddress(address || undefined)}
                />
              </View>
            </>
          )}

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
              style={[styles.rideTypeBtn, rideType === 'roundtrip' && styles.rideTypeBtnActive]}
              onPress={() => setRideType('roundtrip')}
            >
              <Ionicons name="swap-horizontal-outline" size={16} color={rideType === 'roundtrip' ? COLORS.primary : COLORS.textSecondary} />
              <Text style={[styles.rideTypeText, rideType === 'roundtrip' && styles.rideTypeTextActive]}>Round Trip</Text>
            </Pressable>
          </View>

          {rideType === 'roundtrip' && (
            <View style={styles.returnLegBox}>
              <Text style={styles.returnLegHint}>
                <Ionicons name="information-circle-outline" size={13} color={COLORS.gray} /> We'll also post a request for your trip back ({to || 'destination'} → {from || 'origin'}).
              </Text>

              {!!selectedDate && (
                <View style={styles.quickChipsRow}>
                  <Pressable style={styles.quickChip} onPress={() => setReturnDate(selectedDate)}>
                    <Text style={styles.quickChipText}>Same day</Text>
                  </Pressable>
                  <Pressable style={styles.quickChip} onPress={() => setReturnDate(addDays(selectedDate, 1))}>
                    <Text style={styles.quickChipText}>Next day</Text>
                  </Pressable>
                  <Pressable style={styles.quickChip} onPress={() => setReturnDate(addDays(selectedDate, 7))}>
                    <Text style={styles.quickChipText}>In a week</Text>
                  </Pressable>
                </View>
              )}

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <DatePickerInput label="Return Date" value={returnDate} onChange={setReturnDate} minDate={selectedDate ? new Date(selectedDate) : new Date()} maxDate={maxDate} placeholder="Select date" />
                </View>
                <View style={{ flex: 1 }}>
                  <TimePickerInput label="Return Time" value={returnDepartureTime || null} onChange={setReturnDepartureTime} placeholder="Select time" />
                </View>
              </View>
            </View>
          )}

          {/* Note */}
          <Text style={[styles.fieldLabelStandalone, { marginTop: 16 }]}>Note to Driver (Optional)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Any special instructions?"
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
            Drivers will send offers with their price. Accept one and your ride is booked right away.
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
  fieldLabelStandalone: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 10 },

  // Route card (matches HomeScreen / SearchScreen)
  routeCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16, padding: 14, marginBottom: 12, gap: 12,
    borderWidth: 1, borderColor: COLORS.border,
    ...CURVE,
  },
  routeLeft: { alignItems: 'center', gap: 3 },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeVertLine: { width: 2, height: 22, backgroundColor: COLORS.border },
  routeInputs: { flex: 1 },
  routeInputTouch: { paddingVertical: 6 },
  routeInput: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  routeInputPlaceholder: { color: COLORS.gray, fontWeight: '400' },
  routeInputDivider: { height: 1, borderTopWidth: 1, borderTopColor: COLORS.border },
  swapBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
    ...CURVE,
  },
  pinHint:        { fontSize: 11.5, color: COLORS.gray, marginBottom: 8, lineHeight: 16 },
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
  returnLegBox: { backgroundColor: COLORS.lightGray, borderRadius: 14, padding: 14, marginTop: 10, marginBottom: 4 },
  returnLegHint: { fontSize: 12, color: COLORS.gray, marginBottom: 12, lineHeight: 18 },
  quickChipsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  quickChip: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  quickChipText: { fontSize: 11.5, fontWeight: '700', color: COLORS.primary },
  noteInput:      { backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 12, fontSize: 13, color: COLORS.textPrimary, textAlignVertical: 'top', minHeight: 70 },
  infoBanner:     { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.primaryLight, borderRadius: 14, padding: 14, gap: 10, marginTop: 16, marginBottom: 20 },
  infoText:       { flex: 1, fontSize: 13, color: COLORS.primaryDark, lineHeight: 20 },
  postBtn:        { marginTop: 0 },
});
