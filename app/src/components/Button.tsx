import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, RADIUS, CURVE } from './theme';
import { haptics } from '../utils/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
  colors?: string[];
  color?: string;
  size?: number;
  bg?: string;
  disabled?: boolean;
}

// ─── Primary Button (Gradient) ───────────────────────────────────────────────
export const PrimaryButton: React.FC<ButtonProps> = ({ title, onPress, style, loading, icon, colors, disabled }) => {
  const { animStyle, onPressIn, onPressOut } = usePressScale(0.97);
  return (
    <AnimatedPressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={withHaptic(onPress)}
      disabled={!!loading || !!disabled}
      style={[styles.container, disabled && styles.disabled, style, animStyle]}
    >
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
          </>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
};

// ─── Ghost Button (Outlined) ─────────────────────────────────────────────────
export const GhostButton: React.FC<ButtonProps> = ({ title, onPress, style, color, icon }) => {
  const { animStyle, onPressIn, onPressOut } = usePressScale(0.98);
  return (
    <AnimatedPressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={withHaptic(onPress)}
      style={[styles.ghost, { borderColor: color || COLORS.primary }, style, animStyle]}
    >
      {icon && <Ionicons name={icon as any} size={16} color={color || COLORS.primary} style={styles.btnIcon} />}
      <Text style={[styles.ghostText, { color: color || COLORS.primary }]}>{title}</Text>
    </AnimatedPressable>
  );
};

// ─── Icon Button (Circle) ────────────────────────────────────────────────────
export const IconButton: React.FC<ButtonProps> = ({ icon, onPress, size = 40, color = COLORS.primary, bg, style }) => {
  const { animStyle, onPressIn, onPressOut } = usePressScale(0.9);
  return (
    <AnimatedPressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={withHaptic(onPress)}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={[
        styles.iconBtn,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg || COLORS.lightGray },
        style,
        animStyle,
      ]}
    >
      <Ionicons name={icon as any} size={size * 0.5} color={color} />
    </AnimatedPressable>
  );
};

// ─── FAB (Floating Action Button) ────────────────────────────────────────────
export const FAB: React.FC<ButtonProps> = ({ icon, onPress, colors, style }) => {
  const { animStyle, onPressIn, onPressOut } = usePressScale(0.93);
  return (
    <AnimatedPressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={withHaptic(onPress)}
      style={[styles.fabContainer, style, animStyle]}
    >
      <LinearGradient
        colors={(colors || GRADIENTS.primary) as any}
        style={styles.fab}
      >
        <Ionicons name={icon as any} size={20} color="#fff" />
      </LinearGradient>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    ...CURVE,
  },
  disabled: { opacity: 0.5 },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
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
    ...CURVE,
  },
  ghostText: { fontSize: 15, fontWeight: '600' },
  iconBtn: { alignItems: 'center', justifyContent: 'center' },
  fabContainer: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  fab: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
});
