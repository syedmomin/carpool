import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, SHADOWS, RADIUS, SPACING, CURVE } from './theme';
import { StarRating } from './StarRating';
import { RouteTag } from './RouteTag';
import { PressableScale } from './PressableScale';
import { Avatar } from './Avatar';

// ─── Ride Card ────────────────────────────────────────────────────────────────
interface RideCardProps {
  ride: any;
  driver?: any;
  vehicle?: any;
  onPress: () => void;
  boardingCity?: string;
  exitCity?: string;
  segmentPrice?: number;
  isBestValue?: boolean;
  /** List position — enables a staggered fade-in entrance. */
  index?: number;
}
export const RideCard: React.FC<RideCardProps> = ({ ride, driver, vehicle, onPress, boardingCity, exitCity, segmentPrice, isBestValue, index }) => {
  const available = (ride.totalSeats || 0) - (ride.bookedSeats || 0);
  const isSegment = !!(boardingCity && exitCity);
  const displayFrom = isSegment ? boardingCity : ride.from;
  const displayTo = isSegment ? exitCity : ride.to;
  const displayPrice = segmentPrice ?? ride.pricePerSeat;

  const isVerified = driver?.isVerified || driver?.cnicStatus === 'APPROVED';
  const vehicleLabel = vehicle ? `${vehicle.brand || 'Unknown'} ${vehicle.type || ''}`.trim() : null;

  return (
    <PressableScale style={styles.card} onPress={onPress} index={index}>
      {isBestValue && (
        <View style={styles.bestValueBadge}>
          <Ionicons name="sparkles" size={12} color="#fff" />
          <Text style={styles.bestValueText}>BEST VALUE</Text>
        </View>
      )}

      {/* Segment badge */}
      {isSegment && (
        <View style={styles.segmentBadge}>
          <Ionicons name="git-branch-outline" size={11} color={COLORS.primary} />
          <Text style={styles.segmentText}>Partial route</Text>
          <RouteTag from={ride.from} to={ride.to} textStyle={styles.segmentText} arrowColor={COLORS.primary} />
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
        {/* Route visualization */}
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
                <Text style={styles.timeText}>{ride.arrivalTime || '-'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Price */}
        <View style={styles.priceSection}>
          <Text style={styles.priceAmount}>Rs {displayPrice?.toLocaleString() || '-'}</Text>
          <Text style={styles.priceLabel}>per seat</Text>
          {isSegment && segmentPrice && segmentPrice !== ride.pricePerSeat && (
            <Text style={styles.fullPriceNote}>Full: Rs {ride.pricePerSeat?.toLocaleString()}</Text>
          )}
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.rideFooter}>
        <View style={styles.driverInfo}>
          <Avatar name={driver?.name || 'D'} uri={driver?.avatar} size={36} style={styles.driverAvatar} />
          <View>
            {/* Driver name + verified badge */}
            <View style={styles.driverNameRow}>
              <Text style={styles.driverName}>{driver?.name || 'Driver'}</Text>
              {isVerified && (
                <Ionicons name="shield-checkmark" size={14} color="#16a34a" style={{ marginLeft: 4 }} />
              )}
            </View>
            {/* Rating */}
            {driver?.rating > 0 && <StarRating rating={driver.rating} size={11} />}
            {/* Vehicle info */}
            {vehicleLabel ? (
              <View style={styles.vehicleInfo}>
                <Ionicons name="car-outline" size={11} color={COLORS.gray} />
                <Text style={styles.vehicleText}>{vehicleLabel}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={[styles.seatsBadge, { backgroundColor: available > 0 ? '#e8f5e9' : '#ffebee' }]}>
          <Ionicons name="people-outline" size={12} color={available > 0 ? COLORS.secondary : COLORS.danger} />
          <Text style={[styles.seatsText, { color: available > 0 ? COLORS.secondary : COLORS.danger }]}>
            {available} left
          </Text>
        </View>
      </View>

    </PressableScale>
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
  <PressableScale style={[styles.menuCard, SHADOWS.sm, style]} onPress={onPress} scaleTo={0.98}>
    <View style={[styles.menuIcon, { backgroundColor: color ? color + '18' : COLORS.lightGray }]}>
      <Ionicons name={icon as any} size={20} color={color || COLORS.gray} />
    </View>
    <View style={styles.menuInfo}>
      <Text style={styles.menuLabel}>{label}</Text>
      {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
    </View>
    <Ionicons name={rightIcon as any} size={18} color={COLORS.border} />
  </PressableScale>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
    ...CURVE,
  },
  rideHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  routeSection: { flexDirection: 'row', flex: 1 },
  routeLeft: { alignItems: 'center', marginRight: 10, paddingTop: 3 },
  dotBlue: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  routeLine: { width: 2, height: 24, backgroundColor: COLORS.border, marginVertical: 4 },
  routeInfo: { flex: 1, justifyContent: 'space-between', height: 54 },
  routeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cityName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: 0.1 },
  timeWrapper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 12, color: COLORS.gray, fontWeight: '600' },
  priceSection: {
    alignItems: 'flex-end', justifyContent: 'center', marginLeft: 12,
    backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.md,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  priceLabel: { fontSize: 10, color: COLORS.primary, marginTop: 1, fontWeight: '600', opacity: 0.75 },
  priceAmount: { fontSize: 17, fontWeight: '800', color: COLORS.primary, letterSpacing: 0.2 },
  segmentBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 10, gap: 5, alignSelf: 'flex-start' },
  segmentText: { fontSize: 11, fontWeight: '600', color: COLORS.primary },
  multiStopBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0f7fa', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 10, gap: 5, alignSelf: 'flex-start' },
  multiStopText: { fontSize: 11, fontWeight: '600', color: COLORS.teal },
  fullPriceNote: { fontSize: 10, color: COLORS.gray, textDecorationLine: 'line-through', marginTop: 2 },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: COLORS.teal,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 10,
    shadowColor: COLORS.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  bestValueText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  rideFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  driverInfo: { flexDirection: 'row', alignItems: 'center' },
  driverAvatar: { marginRight: 9, borderWidth: 1.5, borderColor: COLORS.border },
  driverNameRow: { flexDirection: 'row', alignItems: 'center' },
  driverName: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  vehicleInfo: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  vehicleText: { fontSize: 11, color: COLORS.gray },
  seatsBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full },
  seatsText: { fontSize: 11, fontWeight: '700', marginLeft: 4 },
  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 4 },

  // Stats Card
  statsCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', ...CURVE },
  statsIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statsValue: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  statsLabel: { fontSize: 11, color: COLORS.gray, marginTop: 2, textAlign: 'center' },

  // Menu Card
  menuCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, ...CURVE },
  menuIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  menuInfo: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  menuSubtitle: { fontSize: 12, color: COLORS.gray, marginTop: 2 },

  // Info Item
  infoItem: { alignItems: 'center', padding: SPACING.sm },
  infoLabel: { fontSize: 11, color: COLORS.gray, marginTop: 4 },
  infoValue: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginTop: 2 },
});
