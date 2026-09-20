import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, SHADOWS, RADIUS, SPACING, CURVE, TYPOGRAPHY } from './theme';
import { RouteTag } from './RouteTag';
import { PressableScale } from './PressableScale';
import { getNiceDate } from '../utils/date';

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
export const RideCard: React.FC<RideCardProps> = ({ ride, onPress, boardingCity, exitCity, segmentPrice, isBestValue, index }) => {
  const available = (ride.totalSeats || 0) - (ride.bookedSeats || 0);
  const isSegment = !!(boardingCity && exitCity);
  const displayFrom = isSegment ? boardingCity : ride.from;
  const displayTo = isSegment ? exitCity : ride.to;
  const displayPrice = segmentPrice ?? ride.pricePerSeat;

  const niceDate = ride.date ? getNiceDate(ride.date) : null;

  return (
    <PressableScale style={styles.card} onPress={onPress} index={index}>
      {isBestValue && (
        <View style={styles.bestValueRibbon}>
          <Ionicons name="sparkles" size={11} color="#fff" />
          <Text style={styles.bestValueText}>BEST VALUE</Text>
        </View>
      )}

      {/* Route line carries the price, time line carries its "per seat"
          unit — two aligned rows instead of a separate price panel. */}
      <View style={styles.headlineRow}>
        <RouteTag
          from={displayFrom}
          to={displayTo}
          textStyle={styles.routeTitle}
          arrowColor={COLORS.primary}
          arrowLineWidth={16}
          style={styles.routeTagFlex}
        />
        <Text style={styles.priceAmount} numberOfLines={1}>Rs {displayPrice?.toLocaleString() || '-'}</Text>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaLeft}>
          <Ionicons name="time-outline" size={12} color={COLORS.textSecondary} />
          <Text style={styles.metaText}>
            {ride.departureTime}{ride.arrivalTime ? ` – ${ride.arrivalTime}` : ''}
          </Text>
          {niceDate && (
            <>
              <View style={styles.metaDot} />
              <Text style={styles.metaText}>{niceDate}</Text>
            </>
          )}
        </View>
        <Text style={styles.priceLabel}>
          {isSegment && segmentPrice && segmentPrice !== ride.pricePerSeat
            ? `per seat · full Rs ${ride.pricePerSeat?.toLocaleString()}`
            : 'per seat'}
        </Text>
      </View>

      {isSegment && (
        <View style={styles.tag}>
          <Ionicons name="git-branch-outline" size={10} color={COLORS.primary} />
          <Text style={styles.tagText}>Segment of</Text>
          <RouteTag from={ride.from} to={ride.to} textStyle={styles.tagText} arrowColor={COLORS.primary} arrowLineWidth={10} />
        </View>
      )}
      {ride.isMultiStop && !isSegment && (
        <View style={[styles.tag, styles.tagTeal]}>
          <Ionicons name="git-branch-outline" size={10} color={COLORS.teal} />
          <Text style={[styles.tagText, { color: COLORS.teal }]}>Multi-stop</Text>
        </View>
      )}

      <View style={styles.footerDivider} />

      <View style={styles.rideFooter}>
        <View style={[styles.seatsBadge, { backgroundColor: available > 0 ? '#e8f5e9' : '#ffebee' }]}>
          <Ionicons name="people-outline" size={11} color={available > 0 ? COLORS.secondary : COLORS.danger} />
          <Text style={[styles.seatsText, { color: available > 0 ? COLORS.secondary : COLORS.danger }]}>
            {available} seat{available === 1 ? '' : 's'} left
          </Text>
        </View>

        <View style={styles.detailsHint}>
          <Text style={styles.detailsHintText}>Details</Text>
          <Ionicons name="chevron-forward" size={13} color={COLORS.primary} />
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
  // Ride Card — headline route line + meta row (like a flight/bus-booking
  // card), a set-apart price panel, and a footer strip. Sizes come from the
  // shared TYPOGRAPHY.card* scale (theme.tsx) instead of one-off numbers
  // per label, which is what made text across the card read as randomly
  // big/small.
  card: {
    backgroundColor: '#fff',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
    ...CURVE,
  },
  // Route line carries the fare, time line carries its "per seat" unit —
  // both rows share the same left/right split so the two right-hand values
  // line up under each other.
  headlineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  routeTagFlex: { flex: 1, minWidth: 0 },
  routeTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: 0.1 },
  priceAmount: { fontSize: 17, fontWeight: '800', color: COLORS.primary, letterSpacing: 0.1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 5 },
  metaLeft: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  metaText: { ...TYPOGRAPHY.cardMeta },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: COLORS.border },
  priceLabel: { ...TYPOGRAPHY.cardCaption, textAlign: 'right' },
  tag: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#eff6ff', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, gap: 4, marginTop: 8 },
  tagTeal: { backgroundColor: '#e0f7fa' },
  tagText: { ...TYPOGRAPHY.label, color: COLORS.primary, fontWeight: '700' },

  bestValueRibbon: {
    position: 'absolute', top: 0, right: SPACING.lg, transform: [{ translateY: -10 }],
    backgroundColor: COLORS.teal, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full,
    flexDirection: 'row', alignItems: 'center', gap: 4, zIndex: 10,
    ...SHADOWS.sm,
  },
  bestValueText: { fontSize: 10, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },

  footerDivider: { height: 1, backgroundColor: COLORS.border, marginTop: 14, marginBottom: 12 },
  rideFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  seatsBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full },
  seatsText: { ...TYPOGRAPHY.cardMeta, fontWeight: '700', marginLeft: 4 },
  detailsHint: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  detailsHintText: { ...TYPOGRAPHY.cardMeta, color: COLORS.primary, fontWeight: '700' },

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
