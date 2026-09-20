import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from './theme';
import { DatePickerInput, TimePickerInput } from './DateTimePicker';
import { useToast } from '../context/ToastContext';
import { ridesApi } from '../services/api';
import { parseApiError } from '../utils/errorMessages';
import { to24Hour, formatLocalDate } from '../utils/date';

interface RideConfirmationModalProps {
  visible: boolean;
  ride: any; // { id, fromCity, toCity, date, departureTime, confirmationType }
  onResolved: () => void; // called once the driver has responded — parent re-checks for the next pending one
}

// Deliberately NOT dismissable (no X, no backdrop-tap-close, Android back
// button is a no-op) — the whole point is the app used to silently assume a
// ride "happened" once its time passed; this forces an explicit answer
// instead of letting the driver swipe past it.
export default function RideConfirmationModal({ visible, ride, onResolved }: RideConfirmationModalProps) {
  const { showToast } = useToast();
  const [mode, setMode] = useState<'ask' | 'update'>('ask');
  const [newDate, setNewDate] = useState<string>('');
  const [newTime, setNewTime] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  if (!ride) return null;
  const isDeparturePassed = ride.confirmationType === 'DEPARTURE_PASSED';
  const route = `${ride.fromCity} → ${ride.toCity}`;

  const reset = () => { setMode('ask'); setNewDate(''); setNewTime(''); };

  const submit = async (action: 'update' | 'still_ongoing' | 'cancel') => {
    if (action === 'update' && (!newDate || !newTime)) {
      showToast('Please pick a new date and time', 'error');
      return;
    }
    setSubmitting(true);
    const { error } = await ridesApi.confirmStatus(
      ride.id, action,
      action === 'update' ? { date: newDate, departureTime: to24Hour(newTime) } : undefined,
    );
    setSubmitting(false);
    if (error) {
      showToast(parseApiError(error), 'error');
      return;
    }
    showToast(
      action === 'cancel' ? 'Ride cancelled' : action === 'update' ? 'Ride updated' : 'Thanks for confirming',
      'success',
    );
    reset();
    onResolved();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={s.overlay}>
        <View style={s.card}>
          <LinearGradient colors={GRADIENTS.primary as any} style={s.iconWrap}>
            <Ionicons name={isDeparturePassed ? 'time-outline' : 'help-circle-outline'} size={26} color="#fff" />
          </LinearGradient>

          {mode === 'ask' ? (
            <>
              <Text style={s.title}>{isDeparturePassed ? 'Did your ride happen?' : 'Still on this ride?'}</Text>
              <Text style={s.route}>{route}</Text>
              <Text style={s.sub}>
                {isDeparturePassed
                  ? `This was due to depart on ${ride.date} at ${ride.departureTime}, but it's still showing as not started. Update its time, or cancel it.`
                  : `This ride has run past its scheduled date (${ride.date}). Please confirm it's genuinely still going.`}
              </Text>

              {isDeparturePassed ? (
                <>
                  <Pressable style={s.primaryBtn} onPress={() => setMode('update')} disabled={submitting}>
                    <Text style={s.primaryBtnText}>Update Time / Date</Text>
                  </Pressable>
                  <Pressable style={s.dangerBtn} onPress={() => submit('cancel')} disabled={submitting}>
                    {submitting ? <ActivityIndicator color={COLORS.danger} /> : <Text style={s.dangerBtnText}>Cancel Ride</Text>}
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable style={s.primaryBtn} onPress={() => submit('still_ongoing')} disabled={submitting}>
                    {submitting ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Yes, Still Ongoing</Text>}
                  </Pressable>
                  <Pressable style={s.dangerBtn} onPress={() => submit('cancel')} disabled={submitting}>
                    <Text style={s.dangerBtnText}>No, Cancel It</Text>
                  </Pressable>
                </>
              )}
            </>
          ) : (
            <>
              <Text style={s.title}>New Departure</Text>
              <Text style={s.route}>{route}</Text>
              <View style={{ width: '100%', marginTop: 14, gap: 10 }}>
                <DatePickerInput
                  label="New Date"
                  value={newDate || null}
                  onChange={setNewDate}
                  minDate={new Date()}
                  maxDate={new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)}
                />
                <TimePickerInput label="New Departure Time" value={newTime || null} onChange={setNewTime} />
              </View>
              <Pressable style={s.primaryBtn} onPress={() => submit('update')} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Confirm New Time</Text>}
              </Pressable>
              <Pressable style={s.ghostBtn} onPress={() => setMode('ask')} disabled={submitting}>
                <Text style={s.ghostBtnText}>Back</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 400, backgroundColor: '#fff', borderRadius: 20, padding: 22, alignItems: 'center' },
  iconWrap: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center' },
  route: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginTop: 4, textAlign: 'center' },
  sub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 19 },
  primaryBtn: { width: '100%', backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 13, alignItems: 'center', marginTop: 16 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14.5 },
  dangerBtn: { width: '100%', backgroundColor: '#fef2f2', borderRadius: 14, paddingVertical: 13, alignItems: 'center', marginTop: 10 },
  dangerBtnText: { color: COLORS.danger, fontWeight: '700', fontSize: 14.5 },
  ghostBtn: { width: '100%', alignItems: 'center', paddingVertical: 10, marginTop: 4 },
  ghostBtnText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 13 },
});
