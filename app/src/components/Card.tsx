import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, SHADOWS, RADIUS, SPACING } from './theme';
import { StarRating } from './StarRating';

// ─── Ride Card ────────────────────────────────────────────────────────────────
interface RideCardProps {
  ride: any;
  driver?: any;
  vehicle?: any;
  onPress: () => void;
  boardingCity?: string;
  exitCity?: string;
  segmentPrice?: number;
}
export const RideCard: React.FC<RideCardProps> = ({ ride, driver, vehicle, onPress, boardingCity, exitCity, segmentPrice }) => {
  const available = (ride.totalSeats || 0) - (ride.bookedSeats || 0);
  const isSegment = !!(boardingCity && exitCity);
  const displayFrom = isSegment ? boardingCity : ride.from;
  const displayTo = isSegment ? exitCity : ride.to;
  const displayPrice = segmentPrice ?? ride.pricePerSeat;

  return (
    <TouchableOpacity style={[styles.card, SHADOWS.md]} onPress={onPress} activeOpacity={0.9}>
      {/* Segment badge */}
      {isSegment && (
        <View style={styles.segmentBadge}>
          <Ionicons name="git-branch-outline" size={11} color={COLORS.primary} />
          <Text style={styles.segmentText}>Partial route • {ride.from} → {ride.to}</Text>
        </View>
      )}

      {/* Multi-stop indicator */}
      {ride.isMultiStop && !isSegment && (
        <View style={styles.multiStopBadge}>
          <Ionicons name="git-branch-outline" size={11} color={COLORS.teal} />
          <Text style={styles.multiStopText}>Multi-stop route</Text>
        </View>
      )}

      <View style={styles.rideHeader}>
        <View style={styles.routeSection}>
          <View style={styles.routeLeft}>
            <View style={styles.dotBlue} />
            <View style={styles.routeLine} />
            <View style={[styles.dotBlue, { backgroundColor: COLORS.secondary }]} />
          </View>
          <View style={styles.routeInfo}>
            <View style={styles.routeRow}>
              <Text style={styles.cityName}>{displayFrom}</Text>
              <View style={styles.timeWrapper}>
                <Ionicons name="time-outline" size={12} color={COLORS.gray} />
                <Text style={styles.timeText}>{ride.departureTime}</Text>
              </View>
            </View>
            <View style={styles.routeRow}>
              <Text style={styles.cityName}>{displayTo}</Text>
              <View style={styles.timeWrapper}>
                <Ionicons name="time-outline" size={12} color={COLORS.gray} />
                <Text style={styles.timeText}>{ride.arrivalTime || '—'}</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>Per Seat</Text>
          <Text style={styles.priceAmount}>Rs {displayPrice?.toLocaleString() || '—'}</Text>
          {isSegment && segmentPrice && segmentPrice !== ride.pricePerSeat && (
            <Text style={styles.fullPriceNote}>Full: Rs {ride.pricePerSeat?.toLocaleString()}</Text>
          )}
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
            {driver?.rating > 0 && <StarRating rating={driver.rating} size={11} />}
          </View>
        </View>

        <View style={[styles.seatsBadge, { backgroundColor: available > 0 ? '#e8f5e9' : '#ffebee' }]}>
          <Ionicons name="people-outline" size={12} color={available > 0 ? COLORS.secondary : COLORS.danger} />
          <Text style={[styles.seatsText, { color: available > 0 ? COLORS.secondary : COLORS.danger }]}>
            {available} left
          </Text>
        </View>
      </View>

    </TouchableOpacity>
  );
};

// ─── Stats Card ───────────────────────────────────────────────────────────────
interface StatsCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  colors?: readonly [string, string, ...string[]];
  style?: StyleProp<ViewStyle>;
}
export const StatsCard: React.FC<StatsCardProps> = ({ icon, value, label, colors, style }) => (
  <View style={[styles.statsCard, SHADOWS.sm, style]}>
    <LinearGradient colors={(colors || GRADIENTS.primary) as any} style={styles.statsIcon}>
      <Ionicons name={(icon) as any} size={20} color="#fff" />
    </LinearGradient>
    <Text style={styles.statsValue}>{value}</Text>
    <Text style={styles.statsLabel}>{label}</Text>
  </View>
);

// ─── Menu Card (Profile menu item) ───────────────────────────────────────────
interface MenuCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  color?: string;
  onPress: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
}
export const MenuCard: React.FC<MenuCardProps> = ({ icon, label, subtitle, color, onPress, rightIcon = 'chevron-forward', style }) => (
  <TouchableOpacity style={[styles.menuCard, SHADOWS.sm, style]} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.menuIcon, { backgroundColor: color ? color + '20' : COLORS.lightGray }]}>
      <Ionicons name={(icon) as any} size={20} color={color || COLORS.gray} />
    </View>
    <View style={styles.menuInfo}>
      <Text style={styles.menuLabel}>{label}</Text>
      {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
    </View>
    <Ionicons name={(rightIcon) as any} size={18} color={COLORS.gray} />
  </TouchableOpacity>
);

// ─── Info Grid Item ───────────────────────────────────────────────────────────
interface InfoItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}
export const InfoItem: React.FC<InfoItemProps> = ({ icon, label, value, color, style }) => (
  <View style={[styles.infoItem, style]}>
    <Ionicons name={(icon) as any} size={16} color={color || COLORS.primary} />
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
  cityName: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  timeWrapper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 13, color: COLORS.gray, fontWeight: '600' },
  priceSection: { alignItems: 'flex-end', justifyContent: 'center', marginLeft: 12 },
  priceLabel: { fontSize: 11, color: COLORS.gray },
  priceAmount: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  segmentBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 10, gap: 5, alignSelf: 'flex-start' },
  segmentText: { fontSize: 11, fontWeight: '600', color: COLORS.primary },
  multiStopBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0f7fa', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 10, gap: 5, alignSelf: 'flex-start' },
  multiStopText: { fontSize: 11, fontWeight: '600', color: COLORS.teal },
  fullPriceNote: { fontSize: 10, color: COLORS.gray, textDecorationLine: 'line-through', marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  rideFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  driverInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  driverName: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  vehicleInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  vehicleText: { fontSize: 12, color: COLORS.gray },
  seatsBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.md },
  seatsText: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 4 },

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
