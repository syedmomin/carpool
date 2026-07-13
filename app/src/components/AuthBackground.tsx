import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { GRADIENTS } from './theme';

const { width: W } = Dimensions.get('window');

/**
 * The shared navy-gradient hero behind every auth screen. Renders:
 *   1. a full-screen deep-navy > blue LinearGradient,
 *   2. two soft glow orbs for depth,
 *   3. a city-skyline + curved-route silhouette anchored to the bottom.
 * Children render on top. Atmosphere only — no layout assumptions.
 */
export default function AuthBackground({ children }: { children: React.ReactNode }) {
  return (
    <LinearGradient
      colors={GRADIENTS.authNavy as any}
      locations={[0, 0.55, 1]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.fill}
    >
      {/* Soft glow orbs — pure atmosphere */}
      <View style={[styles.orb, styles.orbTop]} />
      <View style={[styles.orb, styles.orbBottom]} />

      {/* Bottom skyline + route silhouette */}
      <View pointerEvents="none" style={styles.skylineWrap}>
        <Svg width={W} height={160} viewBox="0 0 100 40" preserveAspectRatio="none">
          <Defs>
            <SvgGrad id="sky" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#0A1B3D" stopOpacity="0" />
              <Stop offset="1" stopColor="#040d22" stopOpacity="0.55" />
            </SvgGrad>
          </Defs>
          {/* Curved route line that sweeps across above the skyline */}
          <Path
            d="M -2 20 C 25 8, 45 30, 70 16 S 102 10, 104 14"
            stroke="rgba(120,170,255,0.30)"
            strokeWidth={0.7}
            strokeDasharray="2.4 2.4"
            fill="none"
          />
          <Circle cx="-1" cy="20" r="1.1" fill="rgba(150,190,255,0.7)" />
          <Circle cx="103" cy="14" r="1.1" fill="rgba(150,190,255,0.7)" />
          {/* Skyline buildings */}
          <Path
            d="M0 40 V30 H6 V24 H12 V32 H18 V20 H22 V34 H30 V26 H36 V30 H42 V22 H46
               V33 H54 V28 H60 V18 H64 V31 H72 V25 H78 V30 H84 V21 H88 V34 H96 V27 H100 V40 Z"
            fill="url(#sky)"
          />
        </Svg>
      </View>

      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbTop: {
    top: -90,
    right: -70,
    width: 260,
    height: 260,
    backgroundColor: 'rgba(80,140,255,0.22)',
  },
  orbBottom: {
    bottom: 40,
    left: -100,
    width: 280,
    height: 280,
    backgroundColor: 'rgba(26,75,168,0.30)',
  },
  skylineWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
