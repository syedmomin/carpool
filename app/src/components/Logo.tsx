import React from 'react';
import { Image, ImageStyle, StyleProp, ImageResizeMode } from 'react-native';

// ─── Brand logo variants ──────────────────────────────────────────────────────
// Real brand assets. Drop a new file in /assets and add one line here.
const LOGO_VARIANTS = {
  auth:   require('../../assets/light-logo.png'),  // brand mark for light backgrounds
  splash: require('../../assets/dark-logo.png'),   // brand mark for the dark splash background
};

export type LogoVariant = keyof typeof LOGO_VARIANTS;

interface Props {
  /** Which brand asset to render. */
  variant?: LogoVariant;
  /** Square shorthand: sets both width and height. Overridden by explicit width/height. */
  size?: number;
  /** Explicit width (px or %). Falls back to `size`. */
  width?: number | string;
  /** Explicit height (px or %). Falls back to `size`. */
  height?: number | string;
  /** Tint color — only meaningful for single-color/monochrome assets. */
  color?: string;
  /** How the image scales within its box. */
  resizeMode?: ImageResizeMode;
  /** Extra style overrides. */
  style?: StyleProp<ImageStyle>;
}

/**
 * Renders the real ChalParo brand logo asset. Everything (variant, width,
 * height, resizeMode, tint) is configurable so the same component fits the
 * splash, auth header, and anywhere else at any size.
 */
export default function Logo({
  variant = 'auth',
  size = 160,
  width,
  height,
  color,
  resizeMode = 'contain',
  style,
}: Props) {
  const w = width ?? size;
  const h = height ?? size;

  return (
    <Image
      source={LOGO_VARIANTS[variant]}
      resizeMode={resizeMode}
      style={[
        { width: w as any, height: h as any },
        color ? { tintColor: color } : null,
        style,
      ]}
    />
  );
}
