import React from 'react';
import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, CURVE } from './theme';

// ─── Avatar ───────────────────────────────────────────────────────────────────
// Premium avatar with per-name gradient, two initials, online dot, edit button.

const AVATAR_GRADIENTS: [string, string][] = [
  ['#1a73e8', '#0d47a1'], // blue
  ['#00897b', '#00574b'], // teal
  ['#e53935', '#b71c1c'], // red
  ['#f59e0b', '#b45309'], // amber
  ['#7c3aed', '#4c1d95'], // purple
  ['#059669', '#064e3b'], // green
  ['#0891b2', '#0e7490'], // cyan
  ['#db2777', '#9d174d'], // pink
];

function getGradient(name: string | undefined): [string, string] {
  if (!name) return AVATAR_GRADIENTS[0];
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return AVATAR_GRADIENTS[sum % AVATAR_GRADIENTS.length];
}

function getInitials(name: string | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
  return (parts[0][0]?.toUpperCase() || '') + (parts[parts.length - 1][0]?.toUpperCase() || '');
}

interface AvatarProps {
  name?: string;
  uri?: string;
  size?: number;
  /** If provided, overrides the gradient with a flat background color (backward compat). */
  color?: string;
  onlineIndicator?: boolean;
  onEdit?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  uri,
  size = 48,
  color,
  onlineIndicator,
  onEdit,
  style,
}) => {
  const fontSize = size * 0.35;
  const gradient = getGradient(name);
  const initials = getInitials(name);
  const hasRing = size >= 56;

  const circleStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    ...(hasRing ? { borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' } : {}),
    ...CURVE,
  };

  return (
    <View style={[styles.wrapper, style]}>
      {uri ? (
        <Image source={{ uri }} style={[styles.circle, circleStyle, { backgroundColor: COLORS.border }]} />
      ) : color ? (
        // Flat color fallback for backward compat
        <View style={[styles.circle, circleStyle, { backgroundColor: color }]}>
          <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
        </View>
      ) : (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.circle, circleStyle]}
        >
          <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
        </LinearGradient>
      )}

      {onlineIndicator && <View style={styles.onlineDot} />}

      {onEdit && (
        <Pressable
          style={styles.editBtn}
          onPress={onEdit}
          android_ripple={{ color: 'rgba(0,0,0,0.1)', radius: 14, borderless: true }}
        >
          <Ionicons name="camera" size={14} color={COLORS.primary} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { position: 'relative', alignSelf: 'flex-start' },
  circle: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#fff', fontWeight: '700', letterSpacing: 0.5 },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: '#fff',
  },
  editBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    // Shadow (iOS)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    // Elevation (Android)
    elevation: 4,
  },
});
