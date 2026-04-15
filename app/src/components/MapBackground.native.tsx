// Native (Android/iOS) — real map with fallback
import React, { useState } from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from './theme';

let MapView: any = null;
let Marker: any = null;
let PROVIDER_DEFAULT: any = null;

try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  PROVIDER_DEFAULT = Maps.PROVIDER_DEFAULT;
} catch (_) {
  // react-native-maps not available (Expo Go), will use fallback
}

interface MapBackgroundProps {
  markers?: { id: string | number; latitude: number; longitude: number }[];
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const FAKE_ROADS = [
  { top: '20%', left: 0, right: 0, height: 2 },
  { top: '50%', left: 0, right: 0, height: 2 },
  { top: '75%', left: 0, right: 0, height: 2 },
  { top: 0, bottom: 0, left: '25%', width: 2 },
  { top: 0, bottom: 0, left: '60%', width: 2 },
];

const FAKE_CARS = [
  { top: '22%', left: '15%' },
  { top: '52%', left: '65%' },
  { top: '30%', left: '45%' },
  { top: '70%', left: '30%' },
];

function FallbackMap({ children, style }: { children?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.mapBg}>
        {FAKE_ROADS.map((road, i) => (
          <View key={i} style={[styles.road, road as any]} />
        ))}
        {FAKE_CARS.map((pos, i) => (
          <View key={i} style={[styles.carMarker, pos as any]}>
            <Ionicons name="car" size={12} color={COLORS.primary} />
          </View>
        ))}
        <View style={styles.centerPin}>
          <View style={styles.pinCircle}>
            <View style={styles.pinDot} />
          </View>
          <View style={styles.pinShadow} />
        </View>
      </View>
      {children}
    </View>
  );
}

export default function MapBackground({ markers = [], children, style }: MapBackgroundProps) {
  const [mapError, setMapError] = useState(false);

  if (!MapView || mapError) {
    return <FallbackMap style={style}>{children}</FallbackMap>;
  }

  return (
    <View style={[styles.container, style]}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: 24.8607,
          longitude: 67.0011,
          latitudeDelta: 0.12,
          longitudeDelta: 0.12,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        onError={() => setMapError(true)}
      >
        {markers.map(m => (
          <Marker key={m.id} coordinate={{ latitude: m.latitude, longitude: m.longitude }} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.carMarker}>
              <Ionicons name="car" size={14} color={COLORS.primary} />
            </View>
          </Marker>
        ))}
      </MapView>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', overflow: 'hidden' },
  mapBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#e8f0e8',
  },
  road: {
    position: 'absolute',
    backgroundColor: '#fff',
    opacity: 0.6,
  },
  carMarker: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  centerPin: {
    position: 'absolute',
    top: '45%',
    left: '47%',
    alignItems: 'center',
  },
  pinCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  pinShadow: {
    width: 40,
    height: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginTop: 2,
  },
});
