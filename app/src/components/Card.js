import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, SHADOWS, RADIUS, SPACING } from './theme';
import { StarRating } from './StarRating';
import { AmenityBadge } from './Badge';

// ─── Ride Card ────────────────────────────────────────────────────────────────
export const RideCard = ({ ride, driver, vehicle, onPress }) => {
  const available = ride.totalSeats - ride.bookedSeats;
  return (
    <TouchableOpacity style={[styles.card, SHADOWS.md]} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.rideHeader}>
        <View style={styles.routeSection}>
          <View style={styles.routeLeft}>
            <View style={styles.dotBlue} />
            <View style={styles.routeLine} />
            <View style={[styles.dotBlue, { backgroundColor: COLORS.secondary }]} />
          </View>
          <View style={styles.routeInfo}>
            <View style={styles.routeRow}>
              <Text style={styles.cityName}>{ride.from}</Text>
              <Text style={styles.timeText}>{ride.departureTime}</Text>
            </View>
            <View style={styles.routeRow}>
              <Text style={styles.cityName}>{ride.to}</Text>
              <Text style={styles.timeText}>{ride.arrivalTime}</Text>
            </View>
          </View>
        </View>
        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>Per Seat</Text>
          <Text style={styles.priceAmount}>Rs {ride.pricePerSeat?.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.rideFooter}>
        <View style={styles.driverInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{driver?.name?.[0] || 'D'}</Text>
          </View>
          <View>
            <Text style={styles.driverName}>{driver?.name || 'Driver'}</Text>
            <StarRating rating={driver?.rating || 4.5} size={12} />
          </View>
        </View>
        <View style={styles.vehicleRow}>
          <Ionicons name="car-outline" size={14} color={COLORS.gray} />
          <Text style={styles.vehicleText}>{vehicle?.brand || 'Vehicle'}</Text>
        </View>
        <View style={[styles.seatsBadge, { backgroundColor: available > 0 ? '#e8f5e9' : '#ffebee' }]}>
          <Ionicons name="people-outline" size={12} color={available > 0 ? COLORS.secondary : COLORS.danger} />
          <Text style={[styles.seatsText, { color: available > 0 ? COLORS.secondary : COLORS.danger }]}>
            {available} seats
          </Text>
        </View>
      </View>

      {ride.amenities?.length > 0 && (
        <View style={styles.amenitiesRow}>
          {ride.amenities.slice(0, 4).map(a => <AmenityBadge key={a} name={a} />)}
        </View>
      )}
    </TouchableOpacity>
  );
};

// ─── Stats Card ───────────────────────────────────────────────────────────────
export const StatsCard = ({ icon, value, label, colors, style }) => (
  <View style={[styles.statsCard, SHADOWS.sm, style]}>
    <LinearGradient colors={colors || GRADIENTS.primary} style={styles.statsIcon}>
      <Ionicons name={icon} size={20} color="#fff" />
    </LinearGradient>
    <Text style={styles.statsValue}>{value}</Text>
    <Text style={styles.statsLabel}>{label}</Text>
  </View>
);

// ─── Menu Card (Profile menu item) ───────────────────────────────────────────
export const MenuCard = ({ icon, label, subtitle, color, onPress, rightIcon = 'chevron-forward', style }) => (
  <TouchableOpacity style={[styles.menuCard, SHADOWS.sm, style]} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.menuIcon, { backgroundColor: color ? color + '20' : COLORS.lightGray }]}>
      <Ionicons name={icon} size={20} color={color || COLORS.gray} />
    </View>
    <View style={styles.menuInfo}>
      <Text style={styles.menuLabel}>{label}</Text>
      {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
    </View>
    <Ionicons name={rightIcon} size={18} color={COLORS.gray} />
  </TouchableOpacity>
);

// ─── Info Grid Item ───────────────────────────────────────────────────────────
export const InfoItem = ({ icon, label, value, color, style }) => (
  <View style={[styles.infoItem, style]}>
    <Ionicons name={icon} size={16} color={color || COLORS.primary} />
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  // Ride Card
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md },
  rideHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  routeSection: { flexDirection: 'row', flex: 1 },
  routeLeft: { alignItems: 'center', marginRight: 10, paddingTop: 3 },
  dotBlue: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  routeLine: { width: 2, height: 24, backgroundColor: COLORS.border, marginVertical: 3 },
  routeInfo: { flex: 1, justifyContent: 'space-between', height: 52 },
  routeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cityName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  timeText: { fontSize: 13, color: COLORS.gray, fontWeight: '500' },
  priceSection: { alignItems: 'flex-end', justifyContent: 'center', marginLeft: 12 },
  priceLabel: { fontSize: 11, color: COLORS.gray },
  priceAmount: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  rideFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  driverInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  driverName: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  vehicleRow: { flexDirection: 'row', alignItems: 'center' },
  vehicleText: { fontSize: 12, color: COLORS.gray, marginLeft: 4 },
  seatsBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.md },
  seatsText: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },

  // Stats Card
  statsCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center' },
  statsIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statsValue: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  statsLabel: { fontSize: 11, color: COLORS.gray, marginTop: 2, textAlign: 'center' },

  // Menu Card
  menuCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm },
  menuIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  menuInfo: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  menuSubtitle: { fontSize: 12, color: COLORS.gray, marginTop: 2 },

  // Info Item
  infoItem: { alignItems: 'center', padding: SPACING.sm },
  infoLabel: { fontSize: 11, color: COLORS.gray, marginTop: 4 },
  infoValue: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginTop: 2 },
});
