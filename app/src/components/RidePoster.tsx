import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, Image } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, CURVE } from './theme';
import { Avatar } from './Avatar';

export interface RidePosterProps {
  fromCity: string;
  toCity: string;
  /** Already formatted for display, e.g. "15 Sep 2026". */
  date: string;
  /** Already formatted for display, e.g. "5:00 PM". */
  time: string;
  seatsAvailable: number;
  pricePerSeat: number;
  driverName: string;
  driverRating?: number;
  driverRideCount?: number;
  driverAvatar?: string;
  style?: StyleProp<ViewStyle>;
}

// ─── Info grid cell ───────────────────────────────────────────────────────────
function InfoCell({ icon, label, value, style }: { icon: string; label: string; value: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.infoCell, style]}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon as any} size={16} color={COLORS.primary} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

// Shareable ride poster — a fixed brand template (logo, layout, decorative
// shapes) with the actual ride's details dropped in via props. Meant to be
// captured to a single image (react-native-view-shot) and shared to
// WhatsApp/Instagram/Facebook, so every visual choice here has to survive
// being flattened into a static picture — no gestures, no live data.
export function RidePoster({
  fromCity, toCity, date, time, seatsAvailable, pricePerSeat,
  driverName, driverRating, driverRideCount, driverAvatar, style,
}: RidePosterProps) {
  return (
    <View style={[styles.card, style]}>
      {/* Corner accents — purely decorative, clipped by the card's own radius */}
      <View style={styles.triangleBack} />
      <View style={styles.triangleFront} />

      <View style={styles.content}>
        <Image source={require('../../assets/auth-logo.png')} style={styles.logo} resizeMode="contain" />

        <View style={styles.badge}>
          <Ionicons name="car-sport" size={13} color={COLORS.primary} />
          <Text style={styles.badgeText}>Ride available</Text>
        </View>

        <View style={styles.routeHeadingRow}>
          <Text style={styles.city} numberOfLines={1}>{fromCity}</Text>
          <View style={styles.arrowDot}>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </View>
          <Text style={styles.city} numberOfLines={1}>{toCity}</Text>
        </View>
        <Text style={styles.tagline}>Safe  ·  Comfortable  ·  Together</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <InfoCell icon="calendar-outline" label="Date" value={date} style={styles.infoCellBorder} />
            <InfoCell icon="time-outline" label="Time" value={time} />
          </View>
          <View style={[styles.infoRow, styles.infoRowBorder]}>
            <InfoCell icon="people-outline" label="Seats available" value={`${seatsAvailable} seats`} style={styles.infoCellBorder} />
            <InfoCell icon="pricetag-outline" label="Price / seat" value={`Rs ${pricePerSeat.toLocaleString()}`} />
          </View>
        </View>

        <View style={styles.routeLineWrap}>
          <Svg width="100%" height="42" viewBox="0 0 400 42">
            <Path d="M14,21 C 100,4 140,38 200,21 C 260,4 300,38 386,21" stroke={COLORS.primary} strokeWidth={2.5} fill="none" />
            {[14, 136, 264, 386].map((x, i) => (
              <Circle key={i} cx={x} cy={21} r={5} fill={COLORS.primary} />
            ))}
          </Svg>
          <View style={styles.routeLineLabels}>
            <Text style={styles.routeLineCity}>{fromCity}</Text>
            <Text style={styles.routeLineCity}>{toCity}</Text>
          </View>
        </View>

        <View style={styles.driverCard}>
          <Avatar name={driverName} uri={driverAvatar} size={44} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.driverNameRow}>
              <Text style={styles.driverName} numberOfLines={1}>{driverName}</Text>
              <View style={styles.verifiedDot}>
                <Ionicons name="checkmark" size={10} color="#fff" />
              </View>
            </View>
            {(driverRating != null || driverRideCount != null) && (
              <View style={styles.driverMetaRow}>
                {driverRating != null && (
                  <View style={styles.driverMetaItem}>
                    <Ionicons name="star" size={13} color={COLORS.warning} />
                    <Text style={styles.driverMetaText}>{driverRating.toFixed(1)}</Text>
                  </View>
                )}
                {driverRideCount != null && (
                  <Text style={styles.driverMetaText}>{driverRideCount}+ rides</Text>
                )}
              </View>
            )}
          </View>
        </View>

        <View style={styles.cta}>
          <Text style={styles.ctaText}>Book on ChalParo</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </View>
        <Text style={styles.caption}>Ride details available in the ChalParo app</Text>

        <Image source={require('../../assets/auth-logo.png')} style={styles.footerLogo} resizeMode="contain" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 20,
    backgroundColor: '#eef4ff',
    overflow: 'hidden',
    ...CURVE,
  },
  triangleBack: {
    position: 'absolute', width: 260, height: 260,
    backgroundColor: COLORS.primaryLight,
    bottom: -160, left: -140,
    transform: [{ rotate: '45deg' }],
  },
  triangleFront: {
    position: 'absolute', width: 160, height: 160,
    backgroundColor: COLORS.primary,
    top: -100, right: -80,
    transform: [{ rotate: '45deg' }],
  },

  content: { flex: 1, padding: '6%', alignItems: 'center' },

  logo: { width: '46%', height: 34, alignSelf: 'flex-start' },

  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.full,
    paddingHorizontal: 12, paddingVertical: 6, marginTop: 16, alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontFamily: FONTS.bold, color: COLORS.primary, letterSpacing: 0.4 },

  routeHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18, maxWidth: '100%' },
  city: { fontSize: 22, fontFamily: FONTS.extraBold, color: COLORS.textPrimary, flexShrink: 1 },
  arrowDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  tagline: { fontSize: 12, color: COLORS.gray, marginTop: 6, fontFamily: FONTS.medium },

  infoCard: {
    width: '100%', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 16,
    marginTop: 20, ...CURVE,
  },
  infoRow: { flexDirection: 'row' },
  infoRowBorder: { borderTopWidth: 1, borderTopColor: 'rgba(26,115,232,0.12)' },
  infoCell: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  infoCellBorder: { borderRightWidth: 1, borderRightColor: 'rgba(26,115,232,0.12)' },
  infoIconWrap: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 10.5, color: COLORS.gray, fontFamily: FONTS.medium },
  infoValue: { fontSize: 13.5, color: COLORS.textPrimary, fontFamily: FONTS.bold, marginTop: 1 },

  routeLineWrap: { width: '100%', marginTop: 22 },
  routeLineLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  routeLineCity: { fontSize: 12, fontFamily: FONTS.bold, color: COLORS.textPrimary },

  driverCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%',
    backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 16, padding: 12, marginTop: 20,
    ...CURVE,
  },
  driverNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  driverName: { fontSize: 15, fontFamily: FONTS.bold, color: COLORS.textPrimary, flexShrink: 1 },
  verifiedDot: { width: 15, height: 15, borderRadius: 8, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  driverMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  driverMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  driverMetaText: { fontSize: 12, color: COLORS.gray, fontFamily: FONTS.medium },

  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: '100%', height: 48, borderRadius: 24, backgroundColor: COLORS.primary,
    marginTop: 22, ...CURVE,
  },
  ctaText: { fontSize: 15, fontFamily: FONTS.bold, color: '#fff' },
  caption: { fontSize: 10.5, color: COLORS.gray, fontFamily: FONTS.medium, marginTop: 8 },

  footerLogo: { width: '30%', height: 22, marginTop: 'auto' },
});
