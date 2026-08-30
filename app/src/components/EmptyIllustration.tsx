import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { COLORS } from './theme';

// Single shared illustration for every "no data" empty state in the app —
// a minimal, single-hue map-pin mark on a soft backdrop, in the same blue
// used everywhere else in the app. Deliberately restrained (one color, thin
// strokes, no cartoon parts) so it reads as a professional brand mark
// rather than an illustration, and stays generic enough for any screen
// (bookings, rides, vehicles, notifications, search results...).
interface EmptyIllustrationProps {
  size?: number;
}

export const EmptyIllustration: React.FC<EmptyIllustrationProps> = ({ size = 128 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 160 160" fill="none">
      {/* Soft backdrop */}
      <Circle cx="80" cy="80" r="72" fill={COLORS.primary + '0a'} />

      {/* Search ring */}
      <Circle
        cx="80" cy="90" r="46"
        stroke={COLORS.primary}
        strokeOpacity={0.25}
        strokeWidth={2.5}
        strokeDasharray="1 9"
      />

      {/* Route line */}
      <Path
        d="M42 134 H118"
        stroke={COLORS.border}
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray="1 12"
      />

      {/* Pin */}
      <Path
        d="M80 38c-15.5 0-28 12.6-28 28.1 0 21 28 51.9 28 51.9s28-30.9 28-51.9C108 50.6 95.5 38 80 38z"
        stroke={COLORS.primary}
        strokeWidth={4}
        strokeLinejoin="round"
        fill={COLORS.primary + '12'}
      />
      <Circle cx="80" cy="66" r="10" fill={COLORS.cardBg} stroke={COLORS.primary} strokeWidth={3.5} />
    </Svg>
  );
};
