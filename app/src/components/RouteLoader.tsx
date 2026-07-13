import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import Svg, { Path, Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';

// Animated.createAnimatedComponent injects `collapsable={false}` which SVG
// elements don't accept. Filter it out before forwarding to the native Path.
const SvgPath = React.forwardRef<any, any>(({ collapsable: _ignored, ...props }, ref) => (
  <Path {...props} ref={ref} />
));
const AnimatedPath = Animated.createAnimatedComponent(SvgPath);

// A symmetric curved "route" centred in the box: a glowing segment travels from
// one map pin, through the centre, to the other pin (looping). Matches the
// splash reference (road arcing toward the destination).
const PIN_H = 19;                          // tip > head-centre distance
const START = { x: 20, y: 98 };            // pin TIP position (wider apart)
const END = { x: 200, y: 98 };             // pin TIP position (wider apart)
// Route connects the marker HEAD CENTRES (not the tips):
const RS = { x: START.x, y: START.y - PIN_H };
const RE = { x: END.x, y: END.y - PIN_H };
const PATH = `M${RS.x},${RS.y} Q110,16 ${RE.x},${RE.y}`;
const PATH_LEN = 200;  // approx length of the arc above
const SEG = 40;        // length of the glowing travelling segment

// Standard map pin whose tip sits exactly at (0,0); positioned by the parent <G>.
function Pin({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <G transform={`translate(${x}, ${y})`}>
      <Path
        d="M0,0 C-2,-8 -9,-12 -9,-19 A9,9 0 1 1 9,-19 C9,-12 2,-8 0,0 Z"
        fill={color}
      />
      <Circle cx={0} cy={-19} r={3.6} fill="#fff" />
    </G>
  );
}

interface Props {
  width?: number;
  height?: number;
  duration?: number;
}

export default function RouteLoader({ width = 240, height = 120, duration = 1600 }: Props) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(t, { toValue: 1, duration, useNativeDriver: false }),
    ).start();
  }, [duration]);

  // Glowing segment travels the full route, pin-to-pin (invisible just off each
  // end so the loop reset isn't visible).
  const dashoffset = t.interpolate({ inputRange: [0, 1], outputRange: [PATH_LEN + SEG, -SEG] });

  return (
    <Svg width={width} height={height} viewBox="0 0 220 110">
      <Defs>
        <LinearGradient id="routeGlow" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#5eb3ff" stopOpacity="0" />
          <Stop offset="0.5" stopColor="#5eb3ff" stopOpacity="1" />
          <Stop offset="1" stopColor="#34c759" stopOpacity="1" />
        </LinearGradient>
      </Defs>

      {/* Faint base route */}
      <Path d={PATH} stroke="rgba(255,255,255,0.18)" strokeWidth={3} fill="none" strokeLinecap="round" />

      {/* Glowing travelling segment */}
      <AnimatedPath
        d={PATH}
        stroke="url(#routeGlow)"
        strokeWidth={4}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${SEG}, ${PATH_LEN + SEG}`}
        strokeDashoffset={dashoffset as any}
      />

      {/* Map pins at both ends — tips sit exactly on the route endpoints */}
      <Pin x={START.x} y={START.y} color="#5eb3ff" />
      <Pin x={END.x} y={END.y} color="#34c759" />
    </Svg>
  );
}
