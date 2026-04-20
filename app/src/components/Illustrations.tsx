import React from 'react';
import { SvgXml } from 'react-native-svg';
import {
  splashIllustration,
  emptyRidesIllustration,
  emptyBookingsIllustration,
  emptyNotificationsIllustration,
  emptyGeneralIllustration,
  emptyChatIllustration,
  emptyReviewsIllustration,
} from './IllustrationAssets';

interface IllustrationProps {
  width?: number;
  height?: number;
  size?: number;
}

export function SplashIllustration({ width = 300, height = 240 }: IllustrationProps) {
  return <SvgXml xml={splashIllustration} width={width} height={height} />;
}

export function EmptyRidesIllustration({ size = 130 }: IllustrationProps) {
  return <SvgXml xml={emptyRidesIllustration} width={size} height={size * 0.8} />;
}

export function EmptyBookingsIllustration({ size = 130 }: IllustrationProps) {
  return <SvgXml xml={emptyBookingsIllustration} width={size} height={size * 0.85} />;
}

export function EmptyNotificationsIllustration({ size = 130 }: IllustrationProps) {
  const xml = emptyNotificationsIllustration || emptyGeneralIllustration;
  return <SvgXml xml={xml} width={size} height={size * 0.85} />;
}

export function EmptyGeneralIllustration({ size = 130 }: IllustrationProps) {
  return <SvgXml xml={emptyGeneralIllustration} width={size} height={size * 0.85} />;
}

export function EmptyChatIllustration({ size = 130 }: IllustrationProps) {
  return <SvgXml xml={emptyChatIllustration} width={size} height={size * 0.85} />;
}

export function EmptyReviewsIllustration({ size = 130 }: IllustrationProps) {
  return <SvgXml xml={emptyReviewsIllustration} width={size} height={size * 0.85} />;
}
