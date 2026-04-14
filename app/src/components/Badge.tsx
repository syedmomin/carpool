import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from './theme';

// ─── Trust Badge System ──────────────────────────────────────────────────────
export interface TrustBadgeDef {
  id: string;
  label: string;
  icon: string;
  color: string;
  bg: string;
}

export function computeBadges(user: any): TrustBadgeDef[] {
  if (!user) return [];
  const badges: TrustBadgeDef[] = [];
  if (user.phoneVerified)
    badges.push({ id: 'phone',   label: 'Phone Verified', icon: 'call',             color: '#00897b', bg: '#e0f7fa' });
  if (user.cnicStatus === 'APPROVED' || user.verification?.cnicStatus === 'APPROVED')
    badges.push({ id: 'cnic',    label: 'CNIC Verified',  icon: 'card',             color: '#43a047', bg: '#e8f5e9' });
  if (user.licenceStatus === 'APPROVED' || user.verification?.licenceStatus === 'APPROVED')
    badges.push({ id: 'licence', label: 'Licensed',       icon: 'car-sport',        color: COLORS.primary, bg: '#eff6ff' });
  if (user.rating >= 4.5 && (user.reviewCount || 0) >= 10)
    badges.push({ id: 'top',     label: 'Top Rated',      icon: 'star',             color: '#f9a825', bg: '#fff8e1' });
  if (user.isVerified)
    badges.push({ id: 'trusted', label: 'Trusted',        icon: 'shield-checkmark', color: COLORS.primary, bg: '#eff6ff' });
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
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, gap: 4 },
  chipText: { fontSize: 11, fontWeight: '700' },
});

// ─── Amenity Badge (AC, WiFi, etc.) ─────────────────────────────────────────
const AMENITY_ICONS = {
  'AC': 'snow-outline',
  'WiFi': 'wifi-outline',
  'Music': 'musical-notes-outline',
  'Water Bottle': 'water-outline',
  'Snacks': 'fast-food-outline',
  'Blanket': 'bed-outline',
};

interface AmenityBadgeProps {
  name: string;
}

export const AmenityBadge: React.FC<AmenityBadgeProps> = ({ name }) => (
  <View style={styles.amenity}>
    <Ionicons name={(AMENITY_ICONS[name] || 'checkmark-circle-outline') as any} size={12} color={COLORS.primary} />
    <Text style={styles.amenityText}>{name}</Text>
  </View>
);

// ─── Status Badge (active, completed, cancelled, pending, in_progress, etc.) ────
const STATUS_CONFIG: any = {
  active:      { bg: '#e8f5e9', color: COLORS.secondary, label: 'Active' },
  confirmed:   { bg: '#e8f5e9', color: COLORS.secondary, label: 'Confirmed' },
  completed:   { bg: '#f0f9ff', color: '#0369a1',        label: 'Completed' },
  cancelled:   { bg: '#fef2f2', color: COLORS.danger,    label: 'Cancelled' },
  rejected:    { bg: '#fef2f2', color: COLORS.danger,    label: 'Rejected' },
  pending:     { bg: '#fffbeb', color: '#b45309',        label: 'Pending' },
  in_progress: { bg: '#ecfeff', color: '#0891b2',        label: 'In Progress' },
  scheduled:   { bg: '#f5f3ff', color: '#7c3aed',        label: 'Scheduled' },
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  style?: StyleProp<ViewStyle>;
}


export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, style }) => {
  const s = (status || '').toLowerCase();
  const cfg = STATUS_CONFIG[s] || STATUS_CONFIG.pending;
  return (
    <View style={[styles.status, { backgroundColor: cfg.bg }, style]}>
      <Text style={[styles.statusText, { color: cfg.color }]}>{label || cfg.label}</Text>
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

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, style }) => (
  <View style={[styles.role, { backgroundColor: role === 'driver' ? '#e8f5e9' : '#eff6ff' }, style]}>
    <Ionicons name={(role === 'driver' ? 'car-outline' : 'person-outline') as any}
      size={12}
      color={role === 'driver' ? COLORS.secondary : COLORS.primary}
    />
    <Text style={[styles.roleText, { color: role === 'driver' ? COLORS.secondary : COLORS.primary }]}>
      {role === 'driver' ? 'Driver' : 'Passenger'}
    </Text>
  </View>
);

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
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginRight: 6,
    marginBottom: 4,
  },
  amenityText: { fontSize: 11, color: COLORS.primary, marginLeft: 4, fontWeight: '500' },

  status: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  statusText: { fontSize: 12, fontWeight: '600' },

  notif: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  role: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  roleText: { fontSize: 12, fontWeight: '600', marginLeft: 4 },

  verified: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f5e9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  verifiedText: { fontSize: 11, color: COLORS.secondary, fontWeight: '600', marginLeft: 3 },
});
