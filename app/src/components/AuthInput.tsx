import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  TextInputProps, Pressable,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GLASS, COLORS, RADIUS } from './theme';

const AView = Animated.View;

interface Props extends Omit<TextInputProps, 'style'> {
  /** Ionicons name shown on the left. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Static left label (e.g. "PK +92") shown instead of / before the field. */
  leftLabel?: string;
  /** Validation message; turns the ring red when present. */
  error?: string;
  /** Renders a password eye-toggle on the right. */
  password?: boolean;
  /**
   * Button mode: the row is a Pressable (not editable) — used for the city
   * picker. `value` is shown, `placeholder` when empty, with a chevron.
   */
  asButton?: boolean;
  onPress?: () => void;
}

/**
 * Frosted glass input for the navy auth screens. Animates a focus ring
 * (border brightens + soft glow) via Reanimated. One component covers text
 * fields, phone (+92), password, and the city-selector button.
 */
export default function AuthInput({
  icon, leftLabel, error, password, asButton, onPress, value, placeholder, ...rest
}: Props) {
  const [focused, setFocused] = useState(false);
  const [hide, setHide] = useState(true);
  const f = useSharedValue(0);

  const setFocus = (v: boolean) => { setFocused(v); f.value = withTiming(v ? 1 : 0, { duration: 180 }); };

  const ringStyle = useAnimatedStyle(() => ({
    borderColor: error
      ? COLORS.danger
      : interpolateColor(f.value, [0, 1], [GLASS.border, GLASS.borderFocus]),
    shadowOpacity: 0.10 + f.value * 0.35,
    backgroundColor: interpolateColor(f.value, [0, 1], [GLASS.inputFill, GLASS.fillStrong]),
  }));

  const Row = (
    <AView style={[styles.row, ringStyle]}>
      {leftLabel ? (
        <View style={styles.leftLabelBox}>
          <Text style={styles.leftLabelText}>{leftLabel}</Text>
        </View>
      ) : icon ? (
        <Ionicons name={icon} size={20} color={GLASS.subOnDark} style={styles.leftIcon} />
      ) : null}

      {asButton ? (
        <Text style={[styles.input, !value && styles.placeholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
      ) : (
        <TextInput
          style={styles.input}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={GLASS.faintOnDark}
          secureTextEntry={password && hide}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          {...rest}
        />
      )}

      {password && (
        <TouchableOpacity onPress={() => setHide(h => !h)} style={styles.rightBtn} hitSlop={8}>
          <Ionicons name={hide ? 'eye-outline' : 'eye-off-outline'} size={20} color={GLASS.subOnDark} />
        </TouchableOpacity>
      )}
      {asButton && (
        <Ionicons name="chevron-down" size={18} color={GLASS.subOnDark} style={styles.rightBtn} />
      )}
    </AView>
  );

  return (
    <View style={styles.wrap}>
      {asButton ? (
        <Pressable onPress={onPress}>{Row}</Pressable>
      ) : Row}
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: 14,
    shadowColor: '#4d8bff',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    overflow: 'hidden',
  },
  leftIcon: { marginRight: 10 },
  leftLabelBox: {
    paddingRight: 12,
    marginRight: 12,
    borderRightWidth: 1,
    borderRightColor: GLASS.border,
    height: '60%',
    justifyContent: 'center',
  },
  leftLabelText: {
    color: GLASS.textOnDark,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  input: {
    flex: 1,
    color: GLASS.textOnDark,
    fontSize: 15,
    fontWeight: '500',
    height: '100%',
    padding: 0,
  },
  placeholder: { color: GLASS.faintOnDark, fontWeight: '400' },
  rightBtn: { paddingLeft: 10 },
  errorText: {
    color: '#ffb4ab',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    marginLeft: 4,
  },
});
