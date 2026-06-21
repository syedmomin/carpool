import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Logo from './Logo';

const { width: W, height: H } = Dimensions.get('window');

// Blue header shape traced pixel-by-pixel from the reference: a curved "swoosh"
// that's shallow/high on the left and sweeps down toward the bottom-right.
// x is 0–100 (% width), y is in screen-height % (viewBox height = 26).
const VB_H = 24;
const SVG_H = H * (VB_H / 100);
// Dense, clean trace of the reference's blue band bottom edge (x%, y% of height).
const EDGE: [number, number][] = [
  [0, 10.75], [5, 9.38], [11, 8.23], [16, 7.39], [21, 6.78], [27, 6.33],
  [32, 6.17], [37, 6.10], [43, 6.17], [48, 6.40], [53, 6.86], [59, 7.55],
  [64, 8.54], [69, 9.83], [72, 10.82], [75, 11.97], [78, 13.64], [81, 15.85],
  [84, 18.29], [87, 19.97], [90, 21.34], [93, 22.26], [96, 22.87], [100, 23.40],
];

// Smooth the sampled points into cubic-bezier commands (Catmull-Rom → bezier).
function smooth(pts: [number, number][]): string {
  let d = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0]},${p2[1]}`;
  }
  return d;
}

const REV = [...EDGE].reverse();
// Fill: top edge → down the right side → along the curved bottom (right→left) → close.
const D = `M0,0 L100,0 L100,${REV[0][1]}${smooth(REV)} L0,0 Z`;

export default function AuthHeader() {
  return (
    <View style={styles.wrap}>
      <Svg
        width={W}
        height={SVG_H}
        viewBox={`0 0 100 ${VB_H}`}
        preserveAspectRatio="none"
        style={styles.svg}
      >
        <Path d={D} fill="#1a73e8" />
      </Svg>

      <View style={styles.logoHolder}>
        <Logo variant="auth" size={150} />
        <Text style={styles.tagline}>Safar Saath, Manzil Aasan</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  // Logo sits below the thin centre band, on white (matches the reference).
  logoHolder: {
    alignItems: 'center',
    paddingTop: H * 0.075,
  },
  tagline: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: -6,
  },
});
