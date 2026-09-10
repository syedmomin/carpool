import React from 'react';
import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, CURVE } from './theme';

interface RoutePickerProps {
  fromValue: string;
  toValue: string;
  fromPlaceholder?: string;
  toPlaceholder?: string;
  onPressFrom: () => void;
  onPressTo: () => void;
  /** Omit to hide the swap button. */
  onSwap?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * Shared "From / To" route picker card — used on Home, Search, Post Ride, and
 * Post Request. One place for the pickup/destination marker colors (primary
 * for the origin, secondary for the destination) so they can't drift between
 * screens again.
 */
export const RoutePicker: React.FC<RoutePickerProps> = ({
  fromValue,
  toValue,
  fromPlaceholder = 'Leaving From',
  toPlaceholder = 'Where To?',
  onPressFrom,
  onPressTo,
  onSwap,
  style,
}) => (
  <View style={[styles.routeCard, style]}>
    <View style={styles.routeLeft}>
      <Ionicons name="location" size={16} color={COLORS.primary} />
      <View style={styles.routeVertLine} />
      <Ionicons name="location" size={16} color={COLORS.secondary} />
    </View>
    <View style={styles.routeInputs}>
      <Pressable style={styles.routeInputTouch} onPress={onPressFrom}>
        <Text style={[styles.routeInput, !fromValue && styles.routeInputPlaceholder]} numberOfLines={1}>
          {fromValue || fromPlaceholder}
        </Text>
      </Pressable>
      <View style={styles.routeInputDivider} />
      <Pressable style={styles.routeInputTouch} onPress={onPressTo}>
        <Text style={[styles.routeInput, !toValue && styles.routeInputPlaceholder]} numberOfLines={1}>
          {toValue || toPlaceholder}
        </Text>
      </Pressable>
    </View>
    {!!onSwap && (
      <Pressable onPress={onSwap} style={styles.swapBtn} hitSlop={8}>
        <Ionicons name="swap-vertical" size={18} color={COLORS.primary} />
      </Pressable>
    )}
  </View>
);

const styles = StyleSheet.create({
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...CURVE,
  },
  routeLeft: { alignItems: 'center', gap: 3 },
  routeVertLine: { width: 2, height: 22, backgroundColor: COLORS.border },
  routeInputs: { flex: 1 },
  routeInputTouch: { paddingVertical: 6 },
  routeInput: { fontSize: 15, fontFamily: FONTS.bold, color: COLORS.textPrimary },
  routeInputPlaceholder: { color: COLORS.gray, fontFamily: FONTS.regular },
  routeInputDivider: { height: 1, borderTopWidth: 1, borderTopColor: COLORS.border },
  swapBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
    ...CURVE,
  },
});
