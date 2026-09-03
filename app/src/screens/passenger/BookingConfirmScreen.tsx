import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, CURVE, AppBar, Avatar, StarRating, RouteTag, PrimaryButton, SectionHeader, PickupPinPicker } from '../../components';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../utils/errorMessages';
import { haptics } from '../../utils/haptics';

export default function BookingConfirmScreen({ navigation, route }) {
  const { rideId, rideData, boardingCity, exitCity, initialSeats } = route.params;
  const { bookRide } = useApp();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const ride = rideData;
  const driver = ride?.driver;
  const vehicle = ride?.vehicle;
  const available = (ride?.totalSeats || 0) - (ride?.bookedSeats || 0);

  const [seats, setSeats] = useState(Math.min(initialSeats || 1, Math.max(available, 1)));
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pickupLat, setPickupLat] = useState<number | undefined>(undefined);
  const [pickupLng, setPickupLng] = useState<number | undefined>(undefined);
  const [pickupAddress, setPickupAddress] = useState<string | undefined>(undefined);
  const [dropLat, setDropLat] = useState<number | undefined>(undefined);
  const [dropLng, setDropLng] = useState<number | undefined>(undefined);
  const [dropAddress, setDropAddress] = useState<string | undefined>(undefined);

  // Seed the pin near the boarding city's known coordinates when the ride's
  // route matches it (avoids opening the picker centered somewhere random
  // before GPS resolves); otherwise the picker falls back to device location.
  const boardingMatchesFrom = !boardingCity || boardingCity.toLowerCase() === (ride?.from || '').toLowerCase();
  const seedLat = boardingMatchesFrom ? ride?.fromLat : undefined;
  const seedLng = boardingMatchesFrom ? ride?.fromLng : undefined;

  const exitMatchesTo = !exitCity || exitCity.toLowerCase() === (ride?.to || '').toLowerCase();
  const dropSeedLat = exitMatchesTo ? ride?.toLat : undefined;
  const dropSeedLng = exitMatchesTo ? ride?.toLng : undefined;

  const totalFare = seats * (ride?.pricePerSeat || 0);

  const handleConfirm = async () => {
    if (pickupLat == null || pickupLng == null) {
      showToast('Please set your exact pickup point on the map', 'warning');
      return;
    }
    if (dropLat == null || dropLng == null) {
      showToast('Please set your exact drop-off point on the map', 'warning');
      return;
    }
    setSubmitting(true);
    const { data, error } = await bookRide(rideId, seats, boardingCity, exitCity, note.trim() || undefined, pickupLat, pickupLng, pickupAddress, dropLat, dropLng, dropAddress);
    setSubmitting(false);
    if (error) {
      showToast(parseApiError(error), 'error');
      return;
    }
    haptics.success();
    navigation.replace('BookingSuccess', {
      rideId,
      seats,
      rideData: ride,
      booking: data || null,
      boardingCity: data?.boardingCity || boardingCity,
      exitCity: data?.exitCity || exitCity,
    });
  };

  return (
    <View style={styles.container}>
      <AppBar title="Confirm Booking" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>

        {/* Route card */}
        <View style={styles.routeCard}>
          <View style={styles.routeCardTop}>
            <RouteTag from={boardingCity ?? ride?.from} to={exitCity ?? ride?.to} textStyle={styles.routeText} />
            <View style={styles.priceBadge}>
              <Text style={styles.priceValue}>Rs {ride?.pricePerSeat?.toLocaleString()}</Text>
              <Text style={styles.priceCaption}>per seat</Text>
            </View>
          </View>
          <Text style={styles.dateText}>{ride?.date}, {ride?.departureTime}</Text>

          <View style={styles.timeline}>
            <View style={styles.timelineTrack}>
              <View style={[styles.timelineDot, { backgroundColor: COLORS.primary }]} />
              <View style={styles.timelineLine} />
              <View style={[styles.timelineDot, { backgroundColor: COLORS.danger }]} />
            </View>
            <View style={styles.timelinePoints}>
              <Text style={styles.pointText} numberOfLines={1}>{ride?.pickupPoint || boardingCity || ride?.from}</Text>
              <Text style={styles.pointText} numberOfLines={1}>{ride?.dropPoint || exitCity || ride?.to}</Text>
            </View>
          </View>
        </View>

        {/* Driver */}
        <SectionHeader title="Driver" style={styles.sectionHeader} />
        <View style={styles.driverCard}>
          <Avatar name={driver?.name} uri={driver?.avatar} size={48} color={COLORS.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.driverName}>{driver?.name || 'Unknown'}</Text>
            {driver?.rating > 0 && (
              <View style={styles.driverRatingRow}>
                <StarRating rating={driver.rating} size={12} />
                {driver?.reviewCount > 0 && <Text style={styles.reviewCount}>({driver.reviewCount})</Text>}
              </View>
            )}
          </View>
        </View>

        {/* Trip details */}
        <SectionHeader title="Trip Details" style={styles.sectionHeader} />
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="car-sport-outline" size={15} color={COLORS.textSecondary} />
              <Text style={styles.infoLabel}>Vehicle</Text>
            </View>
            <Text style={styles.infoValue} numberOfLines={1}>
              {vehicle?.brand} {vehicle?.model}{vehicle?.year ? ` • ${vehicle.year}` : ''}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="people-outline" size={15} color={COLORS.textSecondary} />
              <Text style={styles.infoLabel}>Seats</Text>
            </View>
            <View style={styles.stepperRow}>
              <Pressable
                style={[styles.stepperBtn, seats <= 1 && styles.stepperBtnDisabled]}
                disabled={seats <= 1}
                onPress={() => setSeats(s => Math.max(1, s - 1))}
              >
                <Ionicons name="remove" size={15} color={seats <= 1 ? COLORS.gray : COLORS.primary} />
              </Pressable>
              <Text style={styles.stepperValue}>{seats}</Text>
              <Pressable
                style={[styles.stepperBtn, seats >= available && styles.stepperBtnDisabled]}
                disabled={seats >= available}
                onPress={() => setSeats(s => Math.min(available, s + 1))}
              >
                <Ionicons name="add" size={15} color={seats >= available ? COLORS.gray : COLORS.primary} />
              </Pressable>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Ionicons name="wallet-outline" size={15} color={COLORS.textSecondary} />
              <Text style={styles.infoLabel}>Payment Method</Text>
            </View>
            <Text style={[styles.infoValue, { color: COLORS.primary }]}>Cash on Ride</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <View style={styles.infoLeft}>
              <Ionicons name="cash-outline" size={15} color={COLORS.textSecondary} />
              <Text style={styles.infoLabel}>Total Fare</Text>
            </View>
            <Text style={styles.totalFareValue}>Rs {totalFare.toLocaleString()}</Text>
          </View>
        </View>

        {/* Pickup pin */}
        <SectionHeader title="Exact Pickup Point *" style={styles.sectionHeader} />
        <Text style={styles.pickupHelper}>
          Required. Pin your exact spot so your driver can find you more easily.
        </Text>
        <PickupPinPicker
          initialLat={seedLat}
          initialLng={seedLng}
          onLocationChange={(lat, lng) => { setPickupLat(lat); setPickupLng(lng); }}
          onAddressChange={(address) => setPickupAddress(address || undefined)}
        />

        {/* Drop-off pin */}
        <SectionHeader title="Exact Drop-off Point *" style={[styles.sectionHeader, { marginTop: 20 }]} />
        <Text style={styles.pickupHelper}>
          Required. Pin exactly where you'd like to be dropped off.
        </Text>
        <PickupPinPicker
          initialLat={dropSeedLat}
          initialLng={dropSeedLng}
          onLocationChange={(lat, lng) => { setDropLat(lat); setDropLng(lng); }}
          onAddressChange={(address) => setDropAddress(address || undefined)}
          summaryLabel="Exact drop-off point"
          modalTitle="Set Drop-off Location"
          mapHint="Drag the map so the pin sits on your exact drop-off spot"
          confirmLabel="Confirm Drop-off Point"
        />

        {/* Note */}
        <SectionHeader title="Note to Driver (Optional)" style={[styles.sectionHeader, { marginTop: 20 }]} />
        <TextInput
          style={styles.noteInput}
          placeholder="Any special instructions?"
          placeholderTextColor={COLORS.gray}
          value={note}
          onChangeText={setNote}
          multiline
          maxLength={200}
        />
      </ScrollView>

      {/* Fluid bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 14 }]}>
        <View style={styles.bottomFareCol}>
          <Text style={styles.bottomFareLabel}>Total Fare</Text>
          <Text style={styles.bottomFareValue}>Rs {totalFare.toLocaleString()}</Text>
        </View>
        <PrimaryButton
          title="Confirm Booking"
          onPress={handleConfirm}
          loading={submitting}
          disabled={available < 1}
          style={styles.confirmBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  body: { paddingHorizontal: 16, paddingBottom: 24 },

  routeCard: {
    backgroundColor: COLORS.cardBg, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 8,
    ...CURVE,
  },
  routeCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  routeText: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  priceBadge: { alignItems: 'flex-end' },
  priceValue: { fontSize: 17, fontWeight: '700', color: COLORS.primary },
  priceCaption: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
  dateText: { fontSize: 12.5, color: COLORS.textSecondary, marginTop: 4, marginBottom: 16 },

  timeline: { flexDirection: 'row', gap: 12 },
  timelineTrack: { alignItems: 'center', width: 10 },
  timelineDot: { width: 9, height: 9, borderRadius: 5 },
  timelineLine: { width: 2, flex: 1, minHeight: 18, backgroundColor: COLORS.border, marginVertical: 4 },
  timelinePoints: { flex: 1, justifyContent: 'space-between', gap: 16 },
  pointText: { fontSize: 13.5, color: COLORS.textPrimary, fontWeight: '600' },

  sectionHeader: { marginTop: 18, marginBottom: 8 },

  driverCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
    ...CURVE,
  },
  driverName: { fontSize: 14.5, fontWeight: '700', color: COLORS.textPrimary },
  driverRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  reviewCount: { fontSize: 12, color: COLORS.textSecondary },

  infoCard: {
    backgroundColor: COLORS.cardBg, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14,
    ...CURVE,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  infoValue: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, maxWidth: '55%', textAlign: 'right' },
  totalFareValue: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },

  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepperBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  stepperBtnDisabled: { backgroundColor: COLORS.lightGray },
  stepperValue: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, minWidth: 16, textAlign: 'center' },

  pickupHelper: { fontSize: 11.5, color: COLORS.textSecondary, marginBottom: 10, lineHeight: 16 },

  noteInput: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 14,
    fontSize: 13.5, color: COLORS.textPrimary, minHeight: 70, textAlignVertical: 'top',
  },

  // Fluid bottom bar — floating, elevated card separated from the scroll content,
  // fare preview + CTA side by side (matches Uber/Careem-style checkout bars).
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 14,
  },
  bottomFareCol: { flexShrink: 0 },
  bottomFareLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },
  bottomFareValue: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginTop: 1 },
  confirmBtn: { flex: 1 },
});
