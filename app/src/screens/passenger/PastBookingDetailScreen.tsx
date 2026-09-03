import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CURVE, AppBar, Avatar, StarRating, StatusBadge, SectionHeader, RouteTag } from '../../components';
import { useGlobalModal } from '../../context/GlobalModalContext';
import { estimateRideDistanceKm } from '../../utils/geo';

function durationLabel(from?: string, to?: string, distanceKm?: number | null) {
  if (from && to) {
    const [fh, fm] = from.split(':').map(Number);
    const [th, tm] = to.split(':').map(Number);
    if (![fh, fm, th, tm].some(isNaN)) {
      let mins = (th * 60 + tm) - (fh * 60 + fm);
      if (mins < 0) mins += 24 * 60;
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    }
  }
  // No arrival time on record — estimate from distance at ~35km/h so the
  // row still shows something useful instead of a bare "—".
  if (distanceKm != null) {
    const mins = Math.round((distanceKm / 35) * 60);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h > 0 ? `${h}h ${m}m` : `${m}m`} (est.)`;
  }
  return '—';
}

export default function PastBookingDetailScreen({ navigation, route }) {
  const { booking } = route.params;
  const { showModal } = useGlobalModal();
  const ride = booking?.ride;
  const driver = ride?.driver;
  const vehicle = ride?.vehicle;

  const rideDistanceKm = estimateRideDistanceKm(ride);

  const vehicleLabel = vehicle
    ? `${vehicle.brand || ''} ${vehicle.model || ''}${vehicle.year ? ` • ${vehicle.year}` : ''}`.trim()
    : '—';

  const INFO_ROWS = [
    { label: 'From', value: booking?.boardingCity || ride?.fromCity || ride?.from, icon: 'location-outline' },
    { label: 'To', value: booking?.exitCity || ride?.toCity || ride?.to, icon: 'flag-outline' },
    { label: 'Vehicle', value: vehicleLabel, icon: 'car-outline' },
    { label: 'Distance', value: rideDistanceKm != null ? `${rideDistanceKm} km` : '—', icon: 'navigate-outline' },
    { label: 'Time', value: durationLabel(ride?.departureTime, ride?.arrivalTime, rideDistanceKm), icon: 'time-outline' },
    { label: 'Seats', value: `${booking?.seats ?? 1}`, icon: 'people-outline' },
    { label: 'Fare per Seat', value: `Rs. ${(ride?.pricePerSeat ?? (booking?.totalAmount && booking?.seats ? Math.round(booking.totalAmount / booking.seats) : 0)).toLocaleString()}`, icon: 'pricetag-outline' },
    { label: 'Total Amount', value: `Rs. ${booking?.totalAmount?.toLocaleString() ?? '0'}`, icon: 'cash-outline' },
    { label: 'Payment Method', value: 'Cash', icon: 'wallet-outline' },
    ...(booking?.pickupAddress ? [{ label: 'Pickup Point', value: booking.pickupAddress, icon: 'location-outline' }] : []),
    ...(booking?.dropAddress ? [{ label: 'Drop-off Point', value: booking.dropAddress, icon: 'flag-outline' }] : []),
  ];

  return (
    <View style={styles.container}>
      <AppBar
        title="Past Booking"
        rightAction={<StatusBadge status={booking?.status} />}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        <RouteTag from={ride?.fromCity || ride?.from} to={ride?.toCity || ride?.to} textStyle={styles.routeText} />
        <Text style={styles.dateText}>{ride?.date}, {ride?.departureTime}</Text>

        {/* Driver card */}
        <View style={styles.driverCard}>
          <Avatar name={driver?.name} uri={driver?.avatar} size={48} color={COLORS.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.driverName}>{driver?.name || 'Unknown'}</Text>
            {driver?.rating > 0 && <StarRating rating={driver.rating} size={13} />}
          </View>
          {driver?.phone && (
            <Pressable
              style={styles.iconBtn}
              onPress={() => showModal({ type: 'info', title: 'Call Driver', message: `Call ${driver?.name} at ${driver.phone}?`, confirmText: 'Call' })}
            >
              <Ionicons name="call" size={16} color={COLORS.primary} />
            </Pressable>
          )}
          <Pressable
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Chat', { bookingId: booking.id, otherUser: driver, rideInfo: { label: `${ride?.fromCity} > ${ride?.toCity}` } })}
          >
            <Ionicons name="chatbubble-ellipses" size={16} color={COLORS.primary} />
          </Pressable>
        </View>

        {/* Ride Info */}
        <SectionHeader title="Ride Info" style={styles.sectionHeader} />
        <View style={styles.infoCard}>
          {INFO_ROWS.map((row, i) => (
            <View key={row.label} style={[styles.infoRow, i === INFO_ROWS.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.infoLeft}>
                <Ionicons name={row.icon as any} size={15} color={COLORS.textSecondary} />
                <Text style={styles.infoLabel}>{row.label}</Text>
              </View>
              <Text style={styles.infoValue} numberOfLines={1}>{row.value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  body: { paddingHorizontal: 16, paddingBottom: 32 },
  routeText: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  dateText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, marginBottom: 16 },
  driverCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 20,
    ...CURVE,
  },
  driverName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { marginTop: 0, marginBottom: 10 },
  infoCard: {
    backgroundColor: COLORS.cardBg, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14,
    marginBottom: 24,
    ...CURVE,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  infoValue: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, maxWidth: '55%', textAlign: 'right' },
});
