import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from './theme';

const ROADS_H = [
  { top: '15%', height: 6 },
  { top: '30%', height: 4 },
  { top: '48%', height: 8 },
  { top: '65%', height: 4 },
  { top: '80%', height: 6 },
];

const ROADS_V = [
  { left: '12%', width: 6 },
  { left: '28%', width: 4 },
  { left: '50%', width: 8 },
  { left: '68%', width: 4 },
  { left: '84%', width: 6 },
];

const BLOCKS = [
  { top: '16%', left: '13%',  width: '14%', height: '13%' },
  { top: '16%', left: '29%',  width: '20%', height: '13%' },
  { top: '16%', left: '51%',  width: '16%', height: '13%' },
  { top: '16%', left: '69%',  width: '14%', height: '13%' },
  { top: '31%', left: '13%',  width: '14%', height: '16%' },
  { top: '31%', left: '29%',  width: '20%', height: '16%' },
  { top: '31%', left: '51%',  width: '16%', height: '16%' },
  { top: '31%', left: '69%',  width: '14%', height: '16%' },
  { top: '49%', left: '13%',  width: '14%', height: '15%' },
  { top: '49%', left: '29%',  width: '20%', height: '15%' },
  { top: '49%', left: '51%',  width: '16%', height: '15%' },
  { top: '49%', left: '69%',  width: '14%', height: '15%' },
  { top: '66%', left: '13%',  width: '14%', height: '13%' },
  { top: '66%', left: '29%',  width: '20%', height: '13%' },
  { top: '66%', left: '51%',  width: '16%', height: '13%' },
  { top: '66%', left: '69%',  width: '14%', height: '13%' },
];

const GREEN_PATCHES = [
  { top: '32%', left: '30%',  width: '8%',  height: '6%' },
  { top: '50%', left: '70%',  width: '7%',  height: '5%' },
  { top: '17%', left: '52%',  width: '6%',  height: '4%' },
];

const CARS = [
  { top: '47%', left: '24%',  rotate: '0deg' },
  { top: '30%', left: '60%',  rotate: '90deg' },
  { top: '63%', left: '35%',  rotate: '180deg' },
  { top: '14%', left: '73%',  rotate: '270deg' },
];

interface MapBackgroundProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

function PulsingCar({ top, left, rotate, delay }: any) {
  const opacity = useRef(new Animated.Value(0.7)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1,   duration: 1200, delay, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[styles.carMarker, { top, left, opacity, transform: [{ rotate }] }]}>
      <Ionicons name="car" size={11} color={COLORS.primary} />
    </Animated.View>
  );
}

export default function MapBackground({ children, style }: MapBackgroundProps) {
  return (
    <View style={[styles.container, style]}>
      {/* Base map color */}
      <View style={styles.mapBase} />

      {/* City blocks */}
      {BLOCKS.map((b, i) => (
        <View key={i} style={[styles.block, b as any]} />
      ))}

      {/* Green patches (parks) */}
      {GREEN_PATCHES.map((g, i) => (
        <View key={i} style={[styles.greenPatch, g as any]} />
      ))}

      {/* Horizontal roads */}
      {ROADS_H.map((r, i) => (
        <View key={i} style={[styles.roadH, r as any]}>
          <View style={styles.roadCenter} />
        </View>
      ))}

      {/* Vertical roads */}
      {ROADS_V.map((r, i) => (
        <View key={i} style={[styles.roadV, r as any]}>
          <View style={styles.roadCenterV} />
        </View>
      ))}

      {/* Animated cars */}
      {CARS.map((c, i) => (
        <PulsingCar key={i} top={c.top} left={c.left} rotate={c.rotate} delay={i * 300} />
      ))}

      {/* Center location pin */}
      <View style={styles.pinWrap}>
        <View style={styles.pinRing}>
          <View style={styles.pinCircle}>
            <View style={styles.pinDot} />
          </View>
        </View>
        <View style={styles.pinShadow} />
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', overflow: 'hidden' },
  mapBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f2efe9',
  },
  block: {
    position: 'absolute',
    backgroundColor: '#e8e0d5',
    borderRadius: 2,
  },
  greenPatch: {
    position: 'absolute',
    backgroundColor: '#c8dfc8',
    borderRadius: 3,
  },
  roadH: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#d4cec6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roadCenter: {
    height: 1,
    left: 0,
    right: 0,
    position: 'absolute',
    backgroundColor: '#bcb5ab',
    opacity: 0.5,
  },
  roadV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: '#d4cec6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roadCenterV: {
    width: 1,
    top: 0,
    bottom: 0,
    position: 'absolute',
    backgroundColor: '#bcb5ab',
    opacity: 0.5,
  },
  carMarker: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  pinWrap: {
    position: 'absolute',
    top: '43%',
    left: '48%',
    alignItems: 'center',
  },
  pinRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '25',
    alignItems: 'center',
    justifyContent: 'center',
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
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  pinDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  pinShadow: {
    width: 14,
    height: 5,
    borderRadius: 7,
    backgroundColor: 'rgba(0,0,0,0.12)',
    marginTop: 2,
  },
});
