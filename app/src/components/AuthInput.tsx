import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  TextInputProps, Pressable,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GLASS, COLORS, RADIUS, FONTS } from './theme';

const AView = Animated.View;

// Light-variant palette — mirrors GLASS's role but for a white background.
const LIGHT = {
  border:      COLORS.border,
  borderFocus: COLORS.primary,
  inputFill:   COLORS.white,
  fillStrong:  COLORS.white,
  text:        COLORS.textPrimary,
  sub:         COLORS.gray,
  faint:       '#9ca3af',
};

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
  /** 'dark' (default) = frosted glass for the navy background. 'light' = white field for the light auth background. */
  variant?: 'dark' | 'light';
}

/**
 * Input for the auth screens — dark (frosted glass, navy bg) or light (white
 * field). Animates a focus ring (border brightens + soft glow) via Reanimated.
 * One component covers text fields, phone (+92), password, and the city button.
 */
export default function AuthInput({
  icon, leftLabel, error, password, asButton, onPress, value, placeholder, variant = 'dark', ...rest
}: Props) {
  const [focused, setFocused] = useState(false);
  const [hide, setHide] = useState(true);
  const f = useSharedValue(0);
  const light = variant === 'light';

  const setFocus = (v: boolean) => { setFocused(v); f.value = withTiming(v ? 1 : 0, { duration: 180 }); };

  const ringStyle = useAnimatedStyle(() => ({
    borderColor: error
      ? COLORS.danger
      : interpolateColor(f.value, [0, 1], [light ? LIGHT.border : GLASS.border, light ? LIGHT.borderFocus : GLASS.borderFocus]),
    shadowOpacity: light ? 0.06 + f.value * 0.08 : 0.10 + f.value * 0.35,
    backgroundColor: light ? LIGHT.inputFill : interpolateColor(f.value, [0, 1], [GLASS.inputFill, GLASS.fillStrong]),
  }));

  const subColor = light ? LIGHT.sub : GLASS.subOnDark;
  const textColor = light ? LIGHT.text : GLASS.textOnDark;
  const faintColor = light ? LIGHT.faint : GLASS.faintOnDark;

  const Row = (
    <AView style={[styles.row, light && styles.rowLight, ringStyle]}>
      {leftLabel ? (
        <View style={[styles.leftLabelBox, light && styles.leftLabelBoxLight]}>
          <Text style={[styles.leftLabelText, { color: textColor }]}>{leftLabel}</Text>
        </View>
      ) : icon ? (
        <Ionicons name={icon} size={20} color={subColor} style={styles.leftIcon} />
      ) : null}

      {asButton ? (
        <Text style={[styles.input, { color: textColor }, !value && { color: faintColor, fontFamily: FONTS.regular }]} numberOfLines={1}>
          {value || placeholder}
        </Text>
      ) : (
        <TextInput
          style={[styles.input, { color: textColor }]}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={faintColor}
          secureTextEntry={password && hide}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          {...rest}
        />
      )}

      {password && (
        <Pressable onPress={() => setHide(h => !h)} style={styles.rightBtn} hitSlop={8}>
          <Ionicons name={hide ? 'eye-outline' : 'eye-off-outline'} size={20} color={subColor} />
        </Pressable>
      )}
      {asButton && (
        <Ionicons name="chevron-down" size={18} color={subColor} style={styles.rightBtn} />
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
  rowLight: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
  leftLabelBoxLight: {
    borderRightColor: COLORS.border,
  },
  leftLabelText: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    letterSpacing: 0.3,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.medium,
    height: '100%',
    padding: 0,
  },
  rightBtn: { paddingLeft: 10 },
  errorText: {
    color: '#ffb4ab',
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    marginTop: 6,
    marginLeft: 4,
  },
});
