import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from './theme';

// ─── Amenity Badge (AC, WiFi, etc.) ─────────────────────────────────────────
const AMENITY_ICONS = {
  'AC': 'snow-outline',
  'WiFi': 'wifi-outline',
  'Music': 'musical-notes-outline',
  'Water Bottle': 'water-outline',
  'Snacks': 'fast-food-outline',
  'Blanket': 'bed-outline',
};

export const AmenityBadge = ({ name }) => (
  <View style={styles.amenity}>
    <Ionicons name={AMENITY_ICONS[name] || 'checkmark-circle-outline'} size={12} color={COLORS.primary} />
    <Text style={styles.amenityText}>{name}</Text>
  </View>
);

// ─── Status Badge (active, completed, cancelled, pending) ────────────────────
const STATUS_CONFIG = {
  active:    { bg: '#e8f5e9', color: COLORS.secondary, label: 'Active' },
  completed: { bg: '#e3f2fd', color: COLORS.primary,   label: 'Completed' },
  cancelled: { bg: '#ffebee', color: COLORS.danger,    label: 'Cancelled' },
  pending:   { bg: '#fff8e1', color: '#f59e0b',        label: 'Pending' },
};

export const StatusBadge = ({ status, label, style }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <View style={[styles.status, { backgroundColor: cfg.bg }, style]}>
      <Text style={[styles.statusText, { color: cfg.color }]}>{label || cfg.label}</Text>
    </View>
  );
};

// ─── Notification Badge (count dot) ─────────────────────────────────────────
export const NotifBadge = ({ count, style }) => {
  if (!count || count < 1) return null;
  return (
    <View style={[styles.notif, style]}>
      <Text style={styles.notifText}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
};

// ─── Role Badge (Passenger / Driver) ────────────────────────────────────────
export const RoleBadge = ({ role, style }) => (
  <View style={[styles.role, { backgroundColor: role === 'driver' ? '#e8f5e9' : '#eff6ff' }, style]}>
    <Ionicons
      name={role === 'driver' ? 'car-outline' : 'person-outline'}
      size={12}
      color={role === 'driver' ? COLORS.secondary : COLORS.primary}
    />
    <Text style={[styles.roleText, { color: role === 'driver' ? COLORS.secondary : COLORS.primary }]}>
      {role === 'driver' ? 'Driver' : 'Passenger'}
    </Text>
  </View>
);

// ─── Verified Badge ──────────────────────────────────────────────────────────
export const VerifiedBadge = ({ style }) => (
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
