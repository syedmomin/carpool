import React from 'react';
import { SvgXml } from 'react-native-svg';
import {
  splashIllustration,
  searchIllustration,
  shareRideIllustration,
  safetyIllustration,
  affordableIllustration,
  emptyRidesIllustration,
  emptyBookingsIllustration,
  emptyNotificationsIllustration,
  emptyGeneralIllustration,
  scheduleIllustration,
} from './IllustrationAssets';

export function SplashIllustration({ width = 300, height = 240 }) {
  return <SvgXml xml={splashIllustration} width={width} height={height} />;
}

export function SearchIllustration({ size = 200 }) {
  return <SvgXml xml={searchIllustration} width={size} height={size} />;
}

export function ShareRideIllustration({ size = 200 }) {
  return <SvgXml xml={shareRideIllustration} width={size} height={size} />;
}

export function SafetyIllustration({ size = 200 }) {
  return <SvgXml xml={safetyIllustration} width={size} height={size} />;
}

export function AffordableIllustration({ size = 200 }) {
  return <SvgXml xml={affordableIllustration} width={size} height={size} />;
}

export function EmptyRidesIllustration({ size = 130 }) {
  return <SvgXml xml={emptyRidesIllustration} width={size} height={size * 0.8} />;
}

export function EmptyBookingsIllustration({ size = 130 }) {
  return <SvgXml xml={emptyBookingsIllustration} width={size} height={size * 0.85} />;
}

export function EmptyNotificationsIllustration({ size = 130 }) {
  const xml = emptyNotificationsIllustration || emptyGeneralIllustration;
  return <SvgXml xml={xml} width={size} height={size * 0.85} />;
}

export function EmptyGeneralIllustration({ size = 130 }) {
  return <SvgXml xml={emptyGeneralIllustration} width={size} height={size * 0.85} />;
}

export function ScheduleIllustration({ width = 260, height = 200 }) {
  return <SvgXml xml={scheduleIllustration} width={width} height={height} />;
}
