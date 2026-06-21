import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

// ─── Logo variants ───────────────────────────────────────────────────────────
// Add a future logo by dropping the file in /assets and adding one line here.
const LOGO_VARIANTS = {
  auth:   require('../../assets/auth-logo.png'),    // colored logo + wordmark (light backgrounds)
  splash: require('../../assets/splash-logo.png'),  // logo for the dark splash background
};

export type LogoVariant = keyof typeof LOGO_VARIANTS;

interface Props {
  /** Which logo image to render. */
  variant?: LogoVariant;
  /** Width in px. Height matches width (square) unless `height` is given. */
  size?: number;
  /** Optional explicit height; defaults to `size`. */
  height?: number;
  /** Optional tint color — only meaningful for single-color/monochrome variants. */
  color?: string;
  /** How the image scales within its box. */
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'center';
  /** Extra style overrides. */
  style?: StyleProp<ImageStyle>;
}

export default function Logo({
  variant = 'auth',
  size = 220,
  height,
  color,
  resizeMode = 'contain',
  style,
}: Props) {
  return (
    <Image
      source={LOGO_VARIANTS[variant]}
      resizeMode={resizeMode}
      style={[
        { width: size, height: height ?? size },
        color ? { tintColor: color } : null,
        style,
      ]}
    />
  );
}
