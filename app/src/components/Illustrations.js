import { SvgXml } from 'react-native-svg';
import {
  splashIllustration,
  emptyRidesIllustration,
  emptyBookingsIllustration,
  emptyNotificationsIllustration,
  emptyGeneralIllustration,
} from './IllustrationAssets';

export function SplashIllustration({ width = 300, height = 240 }) {
  return <SvgXml xml={splashIllustration} width={width} height={height} />;
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
