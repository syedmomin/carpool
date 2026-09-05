import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  TextInputProps, Pressable,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GLASS, COLORS, RADIUS, FONTS, SPACING } from './theme';

const AView = Animated.View;

// Light-variant palette — fields float on the light auth background (not
// inside a white card), so the border must read clearly on its own — a plain
// white-on-white card made these nearly invisible before.
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
  /** Static right label (e.g. "+92") shown after the field, before any eye-toggle/chevron. */
  rightLabel?: string;
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
  icon, leftLabel, rightLabel, error, password, asButton, onPress, value, placeholder, variant = 'dark', ...rest
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
    borderWidth: light ? 1.5 : 1,
    shadowOpacity: light ? 0 : 0.10 + f.value * 0.35,
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
        <View style={styles.inputAsTextWrap}>
          <Text
            style={[styles.inputAsText, { color: textColor }, !value && { color: faintColor, fontFamily: FONTS.regular }]}
            numberOfLines={1}
          >
            {value || placeholder}
          </Text>
        </View>
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

      {rightLabel && (
        <View style={[styles.rightLabelBox, light && styles.rightLabelBoxLight]}>
          <Text style={[styles.rightLabelText, { color: textColor }]}>{rightLabel}</Text>
        </View>
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
  wrap: { marginTop: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    shadowColor: '#4d8bff',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    overflow: 'hidden',
  },
  // Flat, bordered look — matches FormInput (the field style used across the
  // rest of the app) instead of a floating drop-shadow card.
  rowLight: {
    shadowOpacity: 0,
    elevation: 0,
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
  rightLabelBox: {
    paddingLeft: 12,
    marginLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: GLASS.border,
    height: '60%',
    justifyContent: 'center',
  },
  rightLabelBoxLight: {
    borderLeftColor: COLORS.border,
  },
  rightLabelText: {
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
  // Text (asButton mode) isn't a native input, so it doesn't auto-center the
  // way TextInput does — a plain Text with height:'100%' rendered top-aligned
  // instead of matching the left icon's vertical center. A View wrapper with
  // justifyContent:'center' centers the Text reliably on both web and native.
  inputAsTextWrap: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
  },
  inputAsText: {
    fontSize: 15,
    fontFamily: FONTS.medium,
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
