// Web fallback — gradient placeholder that mimics a map
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from './theme';

// Fake road-like grid pattern using Views
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

export default function MapBackground({ children, style }) {
  return (
    <View style={[styles.container, style]}>
      {/* Map-like background */}
      <View style={styles.mapBg}>
        {/* Grid lines (roads) */}
        {FAKE_ROADS.map((road, i) => (
          <View key={i} style={[styles.road, road]} />
        ))}
        {/* Fake car icons */}
        {FAKE_CARS.map((pos, i) => (
          <View key={i} style={[styles.carMarker, pos]}>
            <Ionicons name="car" size={12} color={COLORS.primary} />
          </View>
        ))}
        {/* Center location pin */}
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
