import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, RADIUS } from './theme';

// ─── Primary Button (Gradient) ───────────────────────────────────────────────
export const PrimaryButton = ({ title, onPress, style, loading, icon, colors }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={!!loading}
    activeOpacity={0.85}
    style={[styles.container, style]}
  >
    <LinearGradient
      colors={colors || GRADIENTS.primary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.gradient}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color="#fff" style={styles.btnIcon} />}
          <Text style={styles.btnText}>{title}</Text>
        </>
      )}
    </LinearGradient>
  </TouchableOpacity>
);

// ─── Ghost Button (Outlined) ─────────────────────────────────────────────────
export const GhostButton = ({ title, onPress, style, color, icon }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={[styles.ghost, { borderColor: color || COLORS.primary }, style]}
  >
    {icon && <Ionicons name={icon} size={16} color={color || COLORS.primary} style={styles.btnIcon} />}
    <Text style={[styles.ghostText, { color: color || COLORS.primary }]}>{title}</Text>
  </TouchableOpacity>
);

// ─── Icon Button (Circle) ────────────────────────────────────────────────────
export const IconButton = ({ icon, onPress, size = 40, color = COLORS.primary, bg, style }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={[
      styles.iconBtn,
      { width: size, height: size, borderRadius: size / 2, backgroundColor: bg || COLORS.lightGray },
      style,
    ]}
  >
    <Ionicons name={icon} size={size * 0.5} color={color} />
  </TouchableOpacity>
);

// ─── FAB (Floating Action Button) ────────────────────────────────────────────
export const FAB = ({ icon, onPress, colors, style }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.fabContainer, style]}>
    <LinearGradient
      colors={colors || GRADIENTS.primary}
      style={styles.fab}
    >
      <Ionicons name={icon} size={20} color="#fff" />
    </LinearGradient>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { borderRadius: RADIUS.md, overflow: 'hidden' },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  btnIcon: { marginRight: 8 },
  ghost: {
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    paddingVertical: 13,
    paddingHorizontal: 24,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  ghostText: { fontSize: 15, fontWeight: '600' },
  iconBtn: { alignItems: 'center', justifyContent: 'center' },
  fabContainer: { borderRadius: RADIUS.full, overflow: 'hidden' },
  fab: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
});
