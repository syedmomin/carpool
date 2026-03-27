import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from './theme';

// ─── Avatar ───────────────────────────────────────────────────────────────────
// Shows initials or an image placeholder.
// Props:
//   name       - user name (first letter shown)
//   size       - diameter in px (default 48)
//   color      - background color
//   onlineIndicator - shows green dot if true
//   onEdit     - shows camera button if provided
export const Avatar = ({ name, size = 48, color, onlineIndicator, onEdit, style }) => {
  const fontSize = size * 0.38;
  return (
    <View style={[styles.wrapper, style]}>
      <View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: color || COLORS.primary },
        ]}
      >
        <Text style={[styles.initial, { fontSize }]}>{name?.[0]?.toUpperCase() || '?'}</Text>
      </View>

      {onlineIndicator && (
        <View style={[styles.onlineDot, { borderRadius: 6 }]} />
      )}

      {onEdit && (
        <TouchableOpacity style={styles.editBtn} onPress={onEdit} activeOpacity={0.85}>
          <Ionicons name="camera" size={14} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { position: 'relative', alignSelf: 'flex-start' },
  circle: { alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#fff', fontWeight: '700' },
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
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
});
