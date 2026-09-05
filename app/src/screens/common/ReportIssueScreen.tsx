import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CURVE, FormInput, AppBar, SectionHeader, ChipGroup, Avatar, EmptyState } from '../../components';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { reportsApi, ridesApi, bookingsApi } from '../../services/api';
import { parseApiError } from '../../utils/errorMessages';

const REASONS = [
  { label: 'Unsafe Driving',           value: 'UNSAFE_DRIVING' },
  { label: 'Inappropriate Behavior',   value: 'INAPPROPRIATE_BEHAVIOR' },
  { label: 'Fraud or Scam',            value: 'FRAUD_OR_SCAM' },
  { label: 'Fake Profile',             value: 'FAKE_PROFILE' },
  { label: 'Other',                    value: 'OTHER' },
];

export default function ReportIssueScreen({ navigation, route }) {
  const { userRole } = useApp();
  const { showToast } = useToast();

  // Coming from a specific booking (e.g. "Report" on a past ride) skips the
  // people picker entirely — the target is already known.
  const preset = route?.params?.preset;

  const [loadingPeople, setLoadingPeople] = useState(!preset);
  const [people, setPeople] = useState<any[]>(preset ? [preset] : []);
  const [reason, setReason] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(preset?.id || null);
  const [selectedRideId, setSelectedRideId] = useState<string | undefined>(preset?.rideId);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Recent counterparties: for a driver, the passengers on their recent
  // rides; for a passenger, the drivers on their recent bookings. Only
  // people from a completed/confirmed ride are eligible — reporting requires
  // a real, completed interaction with that person.
  const fetchPeople = useCallback(async () => {
    if (preset) return;
    setLoadingPeople(true);
    try {
      if (userRole === 'driver') {
        const { data } = await ridesApi.myRides(1, 20);
        const rides = data?.data || [];
        const seen = new Map<string, any>();
        rides.forEach((ride: any) => {
          (ride.bookings || [])
            .filter((b: any) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
            .forEach((b: any) => {
              const p = b.passenger;
              if (p?.id && !seen.has(p.id)) {
                seen.set(p.id, {
                  id: p.id, name: p.name, avatar: p.avatar, rideId: ride.id,
                  role: 'Passenger',
                  routeLabel: `${ride.fromCity || ride.from || ''} → ${ride.toCity || ride.to || ''}`,
                  dateLabel: ride.date,
                });
              }
            });
        });
        setPeople(Array.from(seen.values()));
      } else {
        const { data } = await bookingsApi.myBookings(1, 20);
        const bookings = data?.data || [];
        const seen = new Map<string, any>();
        bookings
          .filter((b: any) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
          .forEach((b: any) => {
            const d = b.ride?.driver;
            if (d?.id && !seen.has(d.id)) {
              seen.set(d.id, {
                id: d.id, name: d.name, avatar: d.avatar, rideId: b.ride?.id || b.rideId,
                role: 'Driver',
                routeLabel: `${b.ride?.fromCity || b.ride?.from || ''} → ${b.ride?.toCity || b.ride?.to || ''}`,
                dateLabel: b.ride?.date,
              });
            }
          });
        setPeople(Array.from(seen.values()));
      }
    } catch (err) {
      console.error('Fetch report counterparties error:', err);
    } finally {
      setLoadingPeople(false);
    }
  }, [userRole, preset]);

  useFocusEffect(useCallback(() => { fetchPeople(); }, [fetchPeople]));

  const handleSelectPerson = (person: any) => {
    setSelectedId(person.id);
    setSelectedRideId(person.rideId);
  };

  const canSubmit = !!reason && !!selectedId && !submitting;

  const handleSubmit = async () => {
    if (!reason) { showToast('Pick a reason first.', 'error'); return; }
    if (!selectedId) { showToast("Select who you're reporting.", 'error'); return; }

    setSubmitting(true);
    const { error } = await reportsApi.create(selectedId, reason, description.trim() || undefined, selectedRideId);
    setSubmitting(false);

    if (error) { showToast(parseApiError(error), 'error'); return; }
    showToast("Got it, we'll look into this.", 'success');
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <AppBar title="Report Suspicious Activity" onBack={() => navigation.goBack()} />

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <SectionHeader title="What's the issue?" style={styles.sectionHeader} />
          <ChipGroup
            chips={REASONS}
            activeValue={reason}
            onSelect={setReason}
          />

          <SectionHeader title="Who are you reporting?" style={[styles.sectionHeader, { marginTop: 20 }]} />
          <Text style={styles.helperText}>
            {preset
              ? `Reporting ${preset.name} from your ${preset.routeLabel || 'recent'} ride.`
              : userRole === 'driver'
                ? 'Select the passenger from one of your recent rides.'
                : 'Select the driver from one of your recent rides.'}
          </Text>
          {loadingPeople ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
          ) : people.length === 0 ? (
            <EmptyState
              icon="people-outline"
              title="No One to Report Yet"
              subtitle={`You'll need at least one completed ride before you can report someone.`}
              style={styles.emptyState}
            />
          ) : (
            <View style={styles.peopleList}>
              {people.map((person) => {
                const isSelected = selectedId === person.id;
                return (
                  <Pressable
                    key={person.id}
                    style={[styles.personRow, isSelected && styles.personRowSelected]}
                    onPress={() => handleSelectPerson(person)}
                  >
                    <Avatar name={person.name} uri={person.avatar} size={44} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.personNameRow}>
                        <Text style={styles.personName} numberOfLines={1}>{person.name}</Text>
                        <View style={styles.roleBadge}>
                          <Text style={styles.roleBadgeText}>{person.role}</Text>
                        </View>
                      </View>
                      {!!person.routeLabel && (
                        <Text style={styles.personMeta} numberOfLines={1}>
                          {person.routeLabel}{person.dateLabel ? ` · ${person.dateLabel}` : ''}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.radio, isSelected && styles.radioSelected]}>
                      {isSelected && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          <SectionHeader title="Anything else to add?" style={[styles.sectionHeader, { marginTop: 20 }]} />
          <FormInput
            placeholder="Describe what happened (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
          />

          <Pressable
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {submitting
              ? <ActivityIndicator color={COLORS.white} size="small" />
              : <Text style={styles.submitBtnText}>Submit Report</Text>
            }
          </Pressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: COLORS.bg },
  body:             { padding: 24, paddingBottom: 40 },
  sectionHeader:    { marginBottom: 4 },
  helperText:       { fontSize: 13, color: COLORS.textSecondary, marginBottom: 12, lineHeight: 18 },
  emptyState:       { paddingVertical: 24 },

  peopleList:       { gap: 10 },
  personRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.cardBg, borderRadius: 14, padding: 12,
    borderWidth: 1.5, borderColor: COLORS.border, ...CURVE,
  },
  personRowSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  personNameRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  personName:       { flexShrink: 1, fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  personMeta:       { fontSize: 11.5, color: COLORS.textSecondary, marginTop: 2 },
  roleBadge:        { backgroundColor: COLORS.primaryLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  roleBadgeText:    { fontSize: 10, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.3 },
  radio: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected:    { backgroundColor: COLORS.primary, borderColor: COLORS.primary },

  submitBtn:        { backgroundColor: COLORS.danger, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 28, ...CURVE },
  submitBtnDisabled:{ opacity: 0.5 },
  submitBtnText:    { color: COLORS.white, fontSize: 15, fontWeight: '700' },
});
