import React from 'react';
import { View, Pressable, Text, StyleSheet, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, RADIUS, CURVE } from './theme';
import { haptics } from '../utils/haptics';

const withHaptic = (fn?: () => void) => () => { haptics.impact(); fn?.(); };

function usePressScale(scaleTo = 0.97) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onPressIn = () => { scale.value = withTiming(scaleTo, { duration: 80 }); };
  const onPressOut = () => { scale.value = withTiming(1, { duration: 120 }); };
  return { animStyle, onPressIn, onPressOut };
}

interface ButtonProps {
  title?: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Renders a small white circle with this icon at the trailing edge (used on auth screens' CTAs). */
  trailingIcon?: keyof typeof Ionicons.glyphMap;
  colors?: string[];
  color?: string;
  size?: number;
  bg?: string;
  disabled?: boolean;
}

// Every button below keeps its press-scale transform on an inner
// Animated.View rather than on the Pressable itself — Reanimated warns
// ("Property 'transform' ... may be overwritten by a layout animation")
// when a screen's own entering/exiting animation and a component's own
// transform style land on the same node, since a list/card fade-in
// implicitly drives a layout transition on its animated children.
// Keeping the outer node a plain, non-animated Pressable sidesteps that.

// ─── Primary Button (Gradient) ───────────────────────────────────────────────
export const PrimaryButton: React.FC<ButtonProps> = ({ title, onPress, style, loading, icon, trailingIcon, colors, disabled }) => {
  const { animStyle, onPressIn, onPressOut } = usePressScale(0.97);
  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={withHaptic(onPress)}
      disabled={!!loading || !!disabled}
      style={[styles.container, disabled && styles.disabled, style]}
    >
      <Animated.View style={animStyle}>
        <LinearGradient
          colors={(colors || GRADIENTS.primary) as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              {icon && <Ionicons name={icon as any} size={18} color="#fff" style={styles.btnIcon} />}
              <Text style={styles.btnText}>{title}</Text>
              {trailingIcon && (
                <View style={styles.trailingIconBadge}>
                  <Ionicons name={trailingIcon as any} size={16} color={colors ? colors[0] : COLORS.primary} />
                </View>
              )}
            </>
          )}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

// ─── Ghost Button (Outlined) ─────────────────────────────────────────────────
export const GhostButton: React.FC<ButtonProps> = ({ title, onPress, style, color, icon }) => {
  const { animStyle, onPressIn, onPressOut } = usePressScale(0.98);
  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={withHaptic(onPress)}
      style={[styles.ghost, { borderColor: color || COLORS.primary }, style]}
    >
      <Animated.View style={[styles.rowCenter, animStyle]}>
        {icon && <Ionicons name={icon as any} size={16} color={color || COLORS.primary} style={styles.btnIcon} />}
        <Text style={[styles.ghostText, { color: color || COLORS.primary }]}>{title}</Text>
      </Animated.View>
    </Pressable>
  );
};

// ─── Icon Button (Circle) ────────────────────────────────────────────────────
export const IconButton: React.FC<ButtonProps> = ({ icon, onPress, size = 40, color = COLORS.primary, bg, style }) => {
  const { animStyle, onPressIn, onPressOut } = usePressScale(0.9);
  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={withHaptic(onPress)}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={[
        styles.iconBtn,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg || COLORS.lightGray },
        style,
      ]}
    >
      <Animated.View style={animStyle}>
        <Ionicons name={icon as any} size={size * 0.5} color={color} />
      </Animated.View>
    </Pressable>
  );
};

// ─── FAB (Floating Action Button) ────────────────────────────────────────────
export const FAB: React.FC<ButtonProps> = ({ icon, onPress, colors, style }) => {
  const { animStyle, onPressIn, onPressOut } = usePressScale(0.93);
  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={withHaptic(onPress)}
      style={[styles.fabContainer, style]}
    >
      <Animated.View style={animStyle}>
        <LinearGradient
          colors={(colors || GRADIENTS.primary) as any}
          style={styles.fab}
        >
          <Ionicons name={icon as any} size={20} color="#fff" />
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

// Single source of truth for every primary/ghost CTA button in the app —
// change the height/radius here, not per-screen.
export const BUTTON_HEIGHT = 48;
const BUTTON_RADIUS = 14;

const styles = StyleSheet.create({
  container: {
    borderRadius: BUTTON_RADIUS,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
    ...CURVE,
  },
  disabled: { opacity: 0.5 },
  gradient: {
    height: BUTTON_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 10,
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  btnIcon: {},
  trailingIconBadge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  ghost: {
    height: BUTTON_HEIGHT,
    borderRadius: BUTTON_RADIUS,
    borderWidth: 1.5,
    paddingHorizontal: 24,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    ...CURVE,
  },
  ghostText: { fontSize: 14, fontWeight: '600' },
  rowCenter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  iconBtn: { alignItems: 'center', justifyContent: 'center' },
  fabContainer: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  fab: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
});
