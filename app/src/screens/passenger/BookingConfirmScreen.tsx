import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CURVE, AppBar, Avatar, StarRating, RouteTag, PrimaryButton } from '../../components';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../utils/errorMessages';
import { haptics } from '../../utils/haptics';

export default function BookingConfirmScreen({ navigation, route }) {
  const { rideId, rideData, boardingCity, exitCity, initialSeats } = route.params;
  const { bookRide } = useApp();
  const { showToast } = useToast();
  const ride = rideData;
  const driver = ride?.driver;
  const vehicle = ride?.vehicle;
  const available = (ride?.totalSeats || 0) - (ride?.bookedSeats || 0);

  const [seats, setSeats] = useState(Math.min(initialSeats || 1, Math.max(available, 1)));
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const totalFare = seats * (ride?.pricePerSeat || 0);

  const handleConfirm = async () => {
    setSubmitting(true);
    const { data, error } = await bookRide(rideId, seats, boardingCity, exitCity, note.trim() || undefined);
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
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Ride Summary</Text>
          <View style={styles.summaryTopRow}>
            <RouteTag from={boardingCity ?? ride?.from} to={exitCity ?? ride?.to} textStyle={styles.routeText} arrowColor={COLORS.textSecondary} />
            <Text style={styles.priceValue}>Rs {ride?.pricePerSeat?.toLocaleString()}</Text>
          </View>
          <View style={styles.dateRow}>
            <Text style={styles.dateText}>{ride?.date}, {ride?.departureTime}</Text>
            <Text style={styles.priceCaption}>per seat</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.pointRow}>
            <View style={[styles.pointDot, { backgroundColor: COLORS.secondary }]} />
            <Text style={styles.pointText} numberOfLines={1}>{ride?.pickupPoint || boardingCity || ride?.from}</Text>
          </View>
          <View style={styles.pointRow}>
            <View style={[styles.pointDot, { backgroundColor: COLORS.danger }]} />
            <Text style={styles.pointText} numberOfLines={1}>{ride?.dropPoint || exitCity || ride?.to}</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.cardLabel}>Driver</Text>
          <View style={styles.driverRow}>
            <Avatar name={driver?.name} uri={driver?.avatar} size={44} color={COLORS.primary} />
            <View style={{ flex: 1 }}>
              <View style={styles.driverNameRow}>
                <Text style={styles.driverName}>{driver?.name || 'Unknown'}</Text>
                {driver?.rating > 0 && <StarRating rating={driver.rating} size={12} />}
                {driver?.reviewCount > 0 && <Text style={styles.reviewCount}>({driver.reviewCount})</Text>}
              </View>
              <Text style={styles.vehicleMeta} numberOfLines={1}>
                {vehicle?.brand} {vehicle?.model}{vehicle?.year ? ` • ${vehicle.year}` : ''}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Seats</Text>
            <View style={styles.stepperRow}>
              <Pressable
                style={[styles.stepperBtn, seats <= 1 && styles.stepperBtnDisabled]}
                disabled={seats <= 1}
                onPress={() => setSeats(s => Math.max(1, s - 1))}
              >
                <Ionicons name="remove" size={16} color={seats <= 1 ? COLORS.gray : COLORS.primary} />
              </Pressable>
              <Text style={styles.stepperValue}>{seats}</Text>
              <Pressable
                style={[styles.stepperBtn, seats >= available && styles.stepperBtnDisabled]}
                disabled={seats >= available}
                onPress={() => setSeats(s => Math.min(available, s + 1))}
              >
                <Ionicons name="add" size={16} color={seats >= available ? COLORS.gray : COLORS.primary} />
              </Pressable>
            </View>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Total Fare</Text>
            <Text style={styles.totalFareValue}>Rs {totalFare.toLocaleString()}</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Payment Method</Text>
            <Text style={styles.paymentValue}>Cash on Ride</Text>
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 14, marginBottom: 8 }]}>Note to Driver (Optional)</Text>
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
      </ScrollView>

      <View style={styles.bottomBar}>
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
  card: {
    backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: 'rgba(15, 23, 42, 0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 16, elevation: 2,
    ...CURVE,
  },
  cardLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3 },
  summaryTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  routeText: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  priceValue: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  dateText: { fontSize: 12, color: COLORS.textSecondary },
  priceCaption: { fontSize: 11, color: COLORS.textSecondary },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 14 },
  pointRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  pointDot: { width: 8, height: 8, borderRadius: 4 },
  pointText: { flex: 1, fontSize: 13, color: COLORS.textPrimary, fontWeight: '500' },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  driverNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  driverName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  reviewCount: { fontSize: 12, color: COLORS.textSecondary },
  vehicleMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  fieldLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepperBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  stepperBtnDisabled: { backgroundColor: COLORS.lightGray },
  stepperValue: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, minWidth: 16, textAlign: 'center' },
  totalFareValue: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  paymentValue: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  noteInput: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 12,
    fontSize: 13, color: COLORS.textPrimary, minHeight: 60, textAlignVertical: 'top',
  },
  bottomBar: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20, backgroundColor: COLORS.bg },
  confirmBtn: { marginTop: 0 },
});
