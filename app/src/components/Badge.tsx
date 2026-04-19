import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, STATUS_COLORS, TRUST_BADGE_CONFIG, AMENITY_DISPLAY_CONFIG } from './theme';
import type { TrustToken } from './theme';

// ─── Trust Badge System ──────────────────────────────────────────────────────
export interface TrustBadgeDef extends TrustToken {
  id: string;
}

export function computeBadges(user: any): TrustBadgeDef[] {
  if (!user) return [];
  const badges: TrustBadgeDef[] = [];
  if (user.phoneVerified)
    badges.push({ id: 'phone',   ...TRUST_BADGE_CONFIG.phone });
  if (user.cnicStatus === 'APPROVED' || user.verification?.cnicStatus === 'APPROVED')
    badges.push({ id: 'cnic',    ...TRUST_BADGE_CONFIG.cnic });
  if (user.licenceStatus === 'APPROVED' || user.verification?.licenceStatus === 'APPROVED')
    badges.push({ id: 'licence', ...TRUST_BADGE_CONFIG.licence });
  if (user.rating >= 4.5 && (user.reviewCount || 0) >= 10)
    badges.push({ id: 'top',     ...TRUST_BADGE_CONFIG.top });
  if (user.isVerified)
    badges.push({ id: 'trusted', ...TRUST_BADGE_CONFIG.trusted });
  return badges;
}

interface TrustBadgesRowProps {
  user: any;
  max?: number;
  style?: StyleProp<ViewStyle>;
}

export const TrustBadgesRow: React.FC<TrustBadgesRowProps> = ({ user, max, style }) => {
  let badges = computeBadges(user);
  if (max) badges = badges.slice(0, max);
  if (badges.length === 0) return null;
  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, style]}>
      {badges.map(b => (
        <View key={b.id} style={[trustStyles.chip, { backgroundColor: b.bg }]}>
          <Ionicons name={b.icon as any} size={11} color={b.color} />
          <Text style={[trustStyles.chipText, { color: b.color }]}>{b.label}</Text>
        </View>
      ))}
    </View>
  );
};

const trustStyles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.xl, gap: 4 },
  chipText: { fontSize: 11, fontWeight: '700' },
});

// ─── Amenity Badge (AC, WiFi, etc.) ─────────────────────────────────────────
interface AmenityBadgeProps {
  name: string;
}

export const AmenityBadge: React.FC<AmenityBadgeProps> = ({ name }) => {
  const cfg = AMENITY_DISPLAY_CONFIG[name];
  const icon = cfg ? cfg.icon : 'checkmark-circle-outline';
  const color = cfg ? cfg.color : COLORS.primary;
  return (
    <View style={styles.amenity}>
      <Ionicons name={icon as any} size={12} color={color} />
      <Text style={[styles.amenityText, { color }]}>{name}</Text>
    </View>
  );
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
interface StatusBadgeProps {
  status: string;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, style }) => {
  const key = (status || '').toLowerCase();
  const cfg = STATUS_COLORS[key] ?? STATUS_COLORS.pending;
  return (
    <View style={[styles.status, { backgroundColor: cfg.bg }, style]}>
      <Text style={[styles.statusText, { color: cfg.text }]}>{label ?? cfg.label}</Text>
    </View>
  );
};

// ─── Notification Badge (count dot) ─────────────────────────────────────────
interface NotifBadgeProps {
  count?: number;
  style?: StyleProp<ViewStyle>;
}

export const NotifBadge: React.FC<NotifBadgeProps> = ({ count, style }) => {
  if (!count || count < 1) return null;
  return (
    <View style={[styles.notif, style]}>
      <Text style={styles.notifText}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
};

// ─── Role Badge (Passenger / Driver) ────────────────────────────────────────
interface RoleBadgeProps {
  role: 'driver' | 'passenger';
  style?: StyleProp<ViewStyle>;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, style }) => {
  const isDriver = role === 'driver';
  const color = isDriver ? COLORS.secondary : COLORS.primary;
  const bg    = isDriver ? STATUS_COLORS.active.bg : '#eff6ff';
  return (
    <View style={[styles.role, { backgroundColor: bg }, style]}>
      <Ionicons name={(isDriver ? 'car-outline' : 'person-outline') as any} size={12} color={color} />
      <Text style={[styles.roleText, { color }]}>{isDriver ? 'Driver' : 'Passenger'}</Text>
    </View>
  );
};

// ─── Verified Badge ──────────────────────────────────────────────────────────
interface VerifiedBadgeProps {
  style?: StyleProp<ViewStyle>;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ style }) => (
  <View style={[styles.verified, style]}>
    <Ionicons name="shield-checkmark" size={12} color={COLORS.secondary} />
    <Text style={styles.verifiedText}>Verified</Text>
  </View>
);

const styles = StyleSheet.create({
  amenity: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginRight: 6,
    marginBottom: 4,
  },
  amenityText: { fontSize: 11, marginLeft: 4, fontWeight: '500' },

  status: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  statusText: { fontSize: 12, fontWeight: '600' },

  notif: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: RADIUS.sm + 1,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifText: { color: COLORS.white, fontSize: 10, fontWeight: '700' },

  role: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  roleText: { fontSize: 12, fontWeight: '600', marginLeft: 4 },

  verified: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: STATUS_COLORS.active.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  verifiedText: { fontSize: 11, color: COLORS.secondary, fontWeight: '600', marginLeft: 3 },
});
