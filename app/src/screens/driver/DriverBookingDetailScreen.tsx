import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CURVE, AppBar, Avatar, StarRating, StatusBadge, SectionHeader } from '../../components';
import { useToast } from '../../context/ToastContext';
import { estimateRideDistanceKm } from '../../utils/geo';

export default function DriverBookingDetailScreen({ navigation, route }) {
  const { booking } = route.params;
  const { showToast } = useToast();
  const ride = booking?.ride;
  const passenger = booking?.passenger;
  const isCompleted = booking?.status === 'COMPLETED';

  const completedAtLabel = (() => {
    if (!isCompleted || !booking?.updatedAt) return null;
    const d = new Date(booking.updatedAt);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' } as any);
  })();

  const openDirections = (lat?: number | null, lng?: number | null) => {
    if (lat == null || lng == null) {
      showToast('No exact pickup pin for this booking', 'info');
      return;
    }
    const url = Platform.select({
      ios: `maps://app?daddr=${lat},${lng}`,
      android: `google.navigation:q=${lat},${lng}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    });
    Linking.openURL(url as string).catch(() => showToast('Could not open navigation app', 'error'));
  };

  const vehicle = ride?.vehicle;
  const vehicleLabel = vehicle ? `${[vehicle.brand, vehicle.model].filter(Boolean).join(' ')}${vehicle.plateNumber ? ` • ${vehicle.plateNumber}` : ''}` : '—';
  const distanceKm = estimateRideDistanceKm(ride);
  const distanceLabel = distanceKm != null ? `${distanceKm} km` : '—';

  const RIDE_ROWS = [
    { label: 'Route', value: `${ride?.fromCity || ride?.from || '—'} → ${ride?.toCity || ride?.to || '—'}`, icon: 'navigate-outline' },
    { label: 'Date & Time', value: `${ride?.date || '—'}${ride?.departureTime ? `, ${ride.departureTime}` : ''}`, icon: 'calendar-outline' },
    { label: 'Vehicle', value: vehicleLabel, icon: 'car-outline' },
    { label: 'Distance', value: distanceLabel, icon: 'map-outline' },
    { label: 'Seats', value: `${booking?.seats ?? 1}`, icon: 'people-outline' },
    { label: 'Total Fare', value: `Rs. ${booking?.totalAmount?.toLocaleString() ?? '0'}`, icon: 'cash-outline' },
    { label: 'Payment Method', value: 'Cash', icon: 'wallet-outline' },
    // Passenger's exact pickup/drop-off pins — only shown when set on the map.
    ...(booking?.pickupAddress ? [{ label: 'Pickup Point', value: booking.pickupAddress, icon: 'location-outline' }] : []),
    ...(booking?.dropAddress ? [{ label: 'Drop-off Point', value: booking.dropAddress, icon: 'flag-outline' }] : []),
  ];

  const PASSENGER_ROWS = [
    { label: 'Name', value: passenger?.name || 'Unknown', icon: 'person-outline' },
    { label: 'Phone', value: passenger?.phone || '—', icon: 'call-outline' },
  ];

  return (
    <View style={styles.container}>
      <AppBar
        title="Booking Details"
        rightAction={<StatusBadge status={booking?.status} />}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        {/* Passenger card */}
        <View style={styles.passengerCard}>
          <Avatar name={passenger?.name} uri={passenger?.avatar} size={48} color={COLORS.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.passengerName}>{passenger?.name || 'Unknown'}</Text>
            {passenger?.rating > 0 && <StarRating rating={passenger.rating} size={13} />}
          </View>
          {passenger?.phone && (
            <Pressable
              style={styles.iconBtn}
              onPress={() => Linking.openURL(`tel:${passenger.phone}`).catch(() => showToast('Unable to open dialer', 'error'))}
            >
              <Ionicons name="call" size={16} color={COLORS.primary} />
            </Pressable>
          )}
          <Pressable
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Chat', { bookingId: booking.id, otherUser: passenger, rideInfo: { label: `${ride?.fromCity} > ${ride?.toCity}` } })}
          >
            <Ionicons name="chatbubble-ellipses" size={16} color={COLORS.primary} />
          </Pressable>
          {booking?.pickupLat != null && booking?.pickupLng != null && (
            <Pressable style={styles.iconBtn} onPress={() => openDirections(booking.pickupLat, booking.pickupLng)}>
              <Ionicons name="navigate" size={16} color={COLORS.primary} />
            </Pressable>
          )}
        </View>

        {/* Ride Details */}
        <SectionHeader title="Ride Details" />
        <View style={styles.infoCard}>
          {RIDE_ROWS.map((row, i) => (
            <View key={row.label} style={[styles.infoRow, i === RIDE_ROWS.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.infoLeft}>
                <Ionicons name={row.icon as any} size={15} color={COLORS.textSecondary} />
                <Text style={styles.infoLabel}>{row.label}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: '60%' }}>
                <Text style={styles.infoValue} numberOfLines={1}>{row.value}</Text>
                {row.label === 'Drop-off Point' && booking?.dropLat != null && booking?.dropLng != null && (
                  <Pressable onPress={() => openDirections(booking.dropLat, booking.dropLng)} hitSlop={8}>
                    <Ionicons name="navigate-outline" size={16} color={COLORS.primary} />
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Passenger Details */}
        <SectionHeader title="Passenger Details" />
        <View style={styles.infoCard}>
          {PASSENGER_ROWS.map((row, i) => (
            <View key={row.label} style={[styles.infoRow, i === PASSENGER_ROWS.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.infoLeft}>
                <Ionicons name={row.icon as any} size={15} color={COLORS.textSecondary} />
                <Text style={styles.infoLabel}>{row.label}</Text>
              </View>
              <Text style={styles.infoValue} numberOfLines={1}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Trip Summary — only for completed bookings */}
        {isCompleted && (
          <View style={styles.tripSummary}>
            <View style={styles.tripSummaryIcon}>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tripSummaryTitle}>Ride Completed</Text>
              {completedAtLabel && <Text style={styles.tripSummarySubtitle}>{completedAtLabel}</Text>}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  body: { paddingHorizontal: 16, paddingBottom: 32 },
  passengerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 20,
    ...CURVE,
  },
  passengerName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  infoCard: {
    backgroundColor: COLORS.cardBg, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 14,
    marginBottom: 24,
    ...CURVE,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  infoValue: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, maxWidth: '55%', textAlign: 'right' },
  tripSummary: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#e8f5e9', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#c8e6c9', marginBottom: 8,
  },
  tripSummaryIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  tripSummaryTitle: { fontSize: 14, fontWeight: '700', color: COLORS.secondaryDark },
  tripSummarySubtitle: { fontSize: 12.5, color: COLORS.secondaryDark, marginTop: 2, opacity: 0.8 },
});
