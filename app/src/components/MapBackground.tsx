import { Platform } from 'react-native';
import MapBackgroundNative from './MapBackground.native';
import MapBackgroundWeb from './MapBackground.web';

const MapBackground = Platform.select({
  native: MapBackgroundNative,
  default: MapBackgroundWeb,
});

export default MapBackground;
