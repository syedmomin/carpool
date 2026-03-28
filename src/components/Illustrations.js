import React from 'react';
import Svg, {
  Circle, Ellipse, Path, Rect, G, Defs, LinearGradient as SvgGradient,
  Stop, Polygon, Line, ClipPath, Text as SvgText,
} from 'react-native-svg';

// ─── Splash: Animated city + car ────────────────────────────────────────────
export function SplashIllustration({ size = 220 }) {
  return (
    <Svg width={size} height={size * 0.75} viewBox="0 0 220 165">
      <Defs>
        <SvgGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1a73e8" stopOpacity="0.3" />
          <Stop offset="1" stopColor="#e8f4fd" stopOpacity="0.1" />
        </SvgGradient>
        <SvgGradient id="road" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="rgba(255,255,255,0.05)" />
          <Stop offset="0.5" stopColor="rgba(255,255,255,0.15)" />
          <Stop offset="1" stopColor="rgba(255,255,255,0.05)" />
        </SvgGradient>
      </Defs>

      {/* Road */}
      <Rect x="0" y="115" width="220" height="50" rx="0" fill="url(#road)" />
      {/* Road line */}
      <Rect x="20" y="138" width="30" height="4" rx="2" fill="rgba(255,255,255,0.3)" />
      <Rect x="70" y="138" width="30" height="4" rx="2" fill="rgba(255,255,255,0.3)" />
      <Rect x="120" y="138" width="30" height="4" rx="2" fill="rgba(255,255,255,0.3)" />
      <Rect x="170" y="138" width="30" height="4" rx="2" fill="rgba(255,255,255,0.3)" />

      {/* Building left */}
      <Rect x="10" y="60" width="28" height="58" rx="3" fill="rgba(255,255,255,0.12)" />
      <Rect x="14" y="66" width="7" height="8" rx="1" fill="rgba(255,255,255,0.3)" />
      <Rect x="25" y="66" width="7" height="8" rx="1" fill="rgba(255,255,255,0.3)" />
      <Rect x="14" y="80" width="7" height="8" rx="1" fill="rgba(255,255,255,0.25)" />
      <Rect x="25" y="80" width="7" height="8" rx="1" fill="rgba(255,255,255,0.3)" />
      <Rect x="14" y="94" width="7" height="8" rx="1" fill="rgba(255,255,255,0.3)" />
      <Rect x="25" y="94" width="7" height="8" rx="1" fill="rgba(255,255,255,0.2)" />

      {/* Building left tall */}
      <Rect x="42" y="40" width="22" height="78" rx="3" fill="rgba(255,255,255,0.1)" />
      <Rect x="45" y="46" width="6" height="6" rx="1" fill="rgba(255,255,255,0.3)" />
      <Rect x="55" y="46" width="6" height="6" rx="1" fill="rgba(255,255,255,0.25)" />
      <Rect x="45" y="58" width="6" height="6" rx="1" fill="rgba(255,255,255,0.3)" />
      <Rect x="55" y="58" width="6" height="6" rx="1" fill="rgba(255,255,255,0.3)" />
      <Rect x="45" y="70" width="6" height="6" rx="1" fill="rgba(255,255,255,0.2)" />
      <Rect x="55" y="70" width="6" height="6" rx="1" fill="rgba(255,255,255,0.3)" />
      <Rect x="45" y="82" width="6" height="6" rx="1" fill="rgba(255,255,255,0.3)" />
      <Rect x="55" y="82" width="6" height="6" rx="1" fill="rgba(255,255,255,0.25)" />
      <Rect x="45" y="94" width="6" height="6" rx="1" fill="rgba(255,255,255,0.3)" />
      <Rect x="55" y="94" width="6" height="6" rx="1" fill="rgba(255,255,255,0.3)" />

      {/* Building right */}
      <Rect x="150" y="55" width="32" height="63" rx="3" fill="rgba(255,255,255,0.12)" />
      <Rect x="154" y="61" width="8" height="8" rx="1" fill="rgba(255,255,255,0.3)" />
      <Rect x="167" y="61" width="8" height="8" rx="1" fill="rgba(255,255,255,0.25)" />
      <Rect x="154" y="75" width="8" height="8" rx="1" fill="rgba(255,255,255,0.3)" />
      <Rect x="167" y="75" width="8" height="8" rx="1" fill="rgba(255,255,255,0.3)" />
      <Rect x="154" y="89" width="8" height="8" rx="1" fill="rgba(255,255,255,0.2)" />
      <Rect x="167" y="89" width="8" height="8" rx="1" fill="rgba(255,255,255,0.3)" />

      {/* Building right tall */}
      <Rect x="186" y="35" width="26" height="83" rx="3" fill="rgba(255,255,255,0.1)" />
      <Rect x="189" y="41" width="7" height="7" rx="1" fill="rgba(255,255,255,0.3)" />
      <Rect x="200" y="41" width="7" height="7" rx="1" fill="rgba(255,255,255,0.25)" />
      <Rect x="189" y="54" width="7" height="7" rx="1" fill="rgba(255,255,255,0.3)" />
      <Rect x="200" y="54" width="7" height="7" rx="1" fill="rgba(255,255,255,0.3)" />
      <Rect x="189" y="67" width="7" height="7" rx="1" fill="rgba(255,255,255,0.2)" />
      <Rect x="200" y="67" width="7" height="7" rx="1" fill="rgba(255,255,255,0.3)" />
      <Rect x="189" y="80" width="7" height="7" rx="1" fill="rgba(255,255,255,0.3)" />
      <Rect x="200" y="80" width="7" height="7" rx="1" fill="rgba(255,255,255,0.25)" />

      {/* Car body */}
      <Rect x="70" y="99" width="80" height="22" rx="6" fill="rgba(255,255,255,0.95)" />
      <Path d="M85 99 Q95 82 115 82 Q135 82 145 99Z" fill="rgba(255,255,255,0.85)" />
      {/* Windows */}
      <Path d="M90 99 Q97 88 110 87 Q114 87 114 92 L114 99Z" fill="rgba(26,115,232,0.5)" />
      <Path d="M116 87 Q126 87 132 92 L132 99 L116 99Z" fill="rgba(26,115,232,0.4)" />
      {/* Wheels */}
      <Circle cx="90" cy="121" r="10" fill="rgba(40,40,60,0.8)" />
      <Circle cx="90" cy="121" r="5" fill="rgba(255,255,255,0.7)" />
      <Circle cx="130" cy="121" r="10" fill="rgba(40,40,60,0.8)" />
      <Circle cx="130" cy="121" r="5" fill="rgba(255,255,255,0.7)" />
      {/* Headlights */}
      <Rect x="147" y="104" width="8" height="5" rx="2" fill="#ffe082" />
      <Ellipse cx="151" cy="106" rx="12" ry="5" fill="rgba(255,224,130,0.25)" />

      {/* Location pin */}
      <Circle cx="110" cy="24" r="14" fill="rgba(255,255,255,0.2)" />
      <Circle cx="110" cy="24" r="10" fill="rgba(255,255,255,0.3)" />
      <Path d="M110 14 Q118 14 118 22 Q118 28 110 36 Q102 28 102 22 Q102 14 110 14Z" fill="#fff" />
      <Circle cx="110" cy="22" r="4" fill="rgba(26,115,232,0.9)" />
    </Svg>
  );
}

// ─── Onboarding: Slide 1 - Search / Find Ride ───────────────────────────────
export function SearchIllustration({ size = 200 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Phone frame */}
      <Rect x="55" y="20" width="90" height="155" rx="16" fill="rgba(255,255,255,0.2)" />
      <Rect x="60" y="26" width="80" height="143" rx="12" fill="rgba(255,255,255,0.15)" />
      {/* Map dots on phone */}
      <Circle cx="80" cy="80" r="5" fill="rgba(255,255,255,0.9)" />
      <Circle cx="110" cy="65" r="5" fill="rgba(255,255,255,0.9)" />
      <Circle cx="125" cy="90" r="5" fill="rgba(255,255,255,0.9)" />
      <Line x1="80" y1="80" x2="110" y2="65" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeDasharray="4,3" />
      <Line x1="110" y1="65" x2="125" y2="90" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeDasharray="4,3" />
      {/* Search bar on phone */}
      <Rect x="65" y="110" width="70" height="12" rx="6" fill="rgba(255,255,255,0.3)" />
      <Circle cx="73" cy="116" r="4" fill="rgba(255,255,255,0.5)" />
      {/* Bottom home indicator */}
      <Rect x="90" y="157" width="20" height="3" rx="1.5" fill="rgba(255,255,255,0.4)" />

      {/* Big magnifier */}
      <Circle cx="145" cy="50" r="28" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="5" />
      <Line x1="165" y1="70" x2="182" y2="87" stroke="rgba(255,255,255,0.6)" strokeWidth="5" strokeLinecap="round" />
      <Circle cx="145" cy="50" r="18" fill="rgba(255,255,255,0.1)" />
      {/* Small pin inside magnifier */}
      <Path d="M145 40 Q150 40 150 46 Q150 52 145 58 Q140 52 140 46 Q140 40 145 40Z" fill="rgba(255,255,255,0.8)" />
      <Circle cx="145" cy="46" r="3" fill="rgba(26,115,232,0.9)" />

      {/* Stars / sparkles */}
      <Circle cx="35" cy="50" r="4" fill="rgba(255,255,255,0.4)" />
      <Circle cx="28" cy="70" r="2.5" fill="rgba(255,255,255,0.3)" />
      <Circle cx="170" cy="140" r="3" fill="rgba(255,255,255,0.4)" />
      <Circle cx="45" cy="145" r="2" fill="rgba(255,255,255,0.35)" />
    </Svg>
  );
}

// ─── Onboarding: Slide 2 - Share Ride / Earn ────────────────────────────────
export function ShareRideIllustration({ size = 200 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Road */}
      <Ellipse cx="100" cy="155" rx="80" ry="18" fill="rgba(255,255,255,0.08)" />
      <Rect x="30" y="145" width="140" height="22" rx="6" fill="rgba(255,255,255,0.1)" />
      <Rect x="55" y="154" width="25" height="4" rx="2" fill="rgba(255,255,255,0.3)" />
      <Rect x="90" y="154" width="25" height="4" rx="2" fill="rgba(255,255,255,0.3)" />
      <Rect x="125" y="154" width="25" height="4" rx="2" fill="rgba(255,255,255,0.3)" />

      {/* Car */}
      <Rect x="45" y="110" width="110" height="38" rx="10" fill="rgba(255,255,255,0.92)" />
      <Path d="M62 110 Q76 88 100 85 Q124 88 138 110Z" fill="rgba(255,255,255,0.85)" />
      {/* Windows */}
      <Path d="M68 110 Q78 95 95 93 L95 110Z" fill="rgba(26,115,232,0.45)" />
      <Path d="M97 93 Q114 93 122 104 L122 110 L97 110Z" fill="rgba(26,115,232,0.35)" />
      {/* Wheels */}
      <Circle cx="72" cy="148" r="12" fill="rgba(30,30,50,0.85)" />
      <Circle cx="72" cy="148" r="6" fill="rgba(255,255,255,0.7)" />
      <Circle cx="128" cy="148" r="12" fill="rgba(30,30,50,0.85)" />
      <Circle cx="128" cy="148" r="6" fill="rgba(255,255,255,0.7)" />
      {/* Headlights */}
      <Rect x="152" y="118" width="10" height="7" rx="3" fill="#ffe082" />

      {/* 3 passengers inside */}
      <Circle cx="82" cy="103" r="8" fill="rgba(255,200,120,0.9)" />
      <Circle cx="82" cy="96" r="5" fill="rgba(255,200,120,0.9)" />
      <Circle cx="100" cy="103" r="8" fill="rgba(255,180,100,0.9)" />
      <Circle cx="100" cy="96" r="5" fill="rgba(255,180,100,0.9)" />
      <Circle cx="118" cy="103" r="8" fill="rgba(255,200,140,0.9)" />
      <Circle cx="118" cy="96" r="5" fill="rgba(255,200,140,0.9)" />

      {/* Coin / money floating */}
      <Circle cx="160" cy="60" r="20" fill="rgba(255,255,255,0.2)" />
      <Circle cx="160" cy="60" r="15" fill="rgba(255,255,255,0.15)" />
      <SvgText x="160" y="65" textAnchor="middle" fontSize="16" fill="rgba(255,255,255,0.9)" fontWeight="bold">Rs</SvgText>

      {/* Sparkles */}
      <Circle cx="40" cy="55" r="5" fill="rgba(255,255,255,0.35)" />
      <Circle cx="170" cy="90" r="3" fill="rgba(255,255,255,0.3)" />
      <Circle cx="32" cy="130" r="3" fill="rgba(255,255,255,0.25)" />
    </Svg>
  );
}

// ─── Onboarding: Slide 3 - Safety / Verified ────────────────────────────────
export function SafetyIllustration({ size = 200 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Big shield */}
      <Path
        d="M100 20 L160 45 L160 100 Q160 150 100 175 Q40 150 40 100 L40 45 Z"
        fill="rgba(255,255,255,0.15)"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="2"
      />
      <Path
        d="M100 35 L148 56 L148 100 Q148 140 100 160 Q52 140 52 100 L52 56 Z"
        fill="rgba(255,255,255,0.12)"
      />
      {/* Checkmark */}
      <Path
        d="M75 100 L92 117 L128 81"
        fill="none"
        stroke="#fff"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Stars around */}
      <Circle cx="30" cy="60" r="5" fill="rgba(255,255,255,0.4)" />
      <Circle cx="170" cy="60" r="4" fill="rgba(255,255,255,0.35)" />
      <Circle cx="25" cy="120" r="3" fill="rgba(255,255,255,0.3)" />
      <Circle cx="175" cy="120" r="5" fill="rgba(255,255,255,0.3)" />
      <Circle cx="100" cy="185" r="4" fill="rgba(255,255,255,0.3)" />

      {/* CNIC / ID card */}
      <Rect x="55" y="140" width="90" height="48" rx="8" fill="rgba(255,255,255,0.2)" />
      <Circle cx="74" cy="158" r="10" fill="rgba(255,200,120,0.8)" />
      <Rect x="88" y="152" width="45" height="5" rx="2" fill="rgba(255,255,255,0.5)" />
      <Rect x="88" y="162" width="32" height="4" rx="2" fill="rgba(255,255,255,0.35)" />
      <Rect x="60" y="174" width="80" height="8" rx="2" fill="rgba(255,255,255,0.25)" />
      {/* Verified tick on card */}
      <Circle cx="130" cy="150" r="9" fill="rgba(76,175,80,0.9)" />
      <Path d="M126 150 L129 153 L135 147" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── Onboarding: Slide 4 - Affordable ───────────────────────────────────────
export function AffordableIllustration({ size = 200 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {/* Big coin */}
      <Circle cx="100" cy="85" r="60" fill="rgba(255,255,255,0.18)" />
      <Circle cx="100" cy="85" r="50" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
      {/* Rs text */}
      <Path d="M82 68 L82 102 M82 76 Q90 76 90 82 Q90 88 82 88 L90 102" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="80" y1="92" x2="92" y2="100" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <Line x1="80" y1="88" x2="95" y2="88" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <Line x1="84" y1="68" x2="112" y2="68" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      <Path d="M108 68 L108 80 Q100 82 108 90 L118 102" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Down arrow (cheaper) */}
      <Circle cx="155" cy="140" r="22" fill="rgba(255,255,255,0.15)" />
      <Path d="M155 130 L155 150 M147 142 L155 150 L163 142" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Up arrow (comfort) */}
      <Circle cx="45" cy="140" r="22" fill="rgba(255,255,255,0.15)" />
      <Path d="M45 150 L45 130 M37 138 L45 130 L53 138" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Label under left */}
      <Rect x="28" y="167" width="35" height="8" rx="4" fill="rgba(255,255,255,0.2)" />
      {/* Label under right */}
      <Rect x="136" y="167" width="38" height="8" rx="4" fill="rgba(255,255,255,0.2)" />

      {/* Stars */}
      <Circle cx="30" cy="50" r="4" fill="rgba(255,255,255,0.35)" />
      <Circle cx="172" cy="50" r="5" fill="rgba(255,255,255,0.3)" />
      <Circle cx="22" cy="95" r="3" fill="rgba(255,255,255,0.25)" />
    </Svg>
  );
}

// ─── Empty: No Rides Found ───────────────────────────────────────────────────
export function EmptyRidesIllustration({ size = 130 }) {
  return (
    <Svg width={size} height={size * 0.8} viewBox="0 0 130 104">
      {/* Road */}
      <Rect x="5" y="70" width="120" height="30" rx="5" fill="#f0f4ff" />
      <Rect x="20" y="83" width="20" height="4" rx="2" fill="#c7d7f5" />
      <Rect x="55" y="83" width="20" height="4" rx="2" fill="#c7d7f5" />
      <Rect x="90" y="83" width="20" height="4" rx="2" fill="#c7d7f5" />
      {/* Ghost car */}
      <Rect x="35" y="44" width="60" height="28" rx="8" fill="#e8edf8" />
      <Path d="M46 44 Q54 30 65 28 Q76 30 84 44Z" fill="#dce6f5" />
      {/* Windows (semi transparent = ghost) */}
      <Path d="M50 44 Q56 36 63 35 L63 44Z" fill="rgba(140,160,210,0.3)" />
      <Path d="M65 35 Q72 35 78 40 L78 44 L65 44Z" fill="rgba(140,160,210,0.3)" />
      {/* Wheels */}
      <Circle cx="50" cy="72" r="9" fill="#d0d8ec" />
      <Circle cx="50" cy="72" r="4" fill="#eef1fa" />
      <Circle cx="80" cy="72" r="9" fill="#d0d8ec" />
      <Circle cx="80" cy="72" r="4" fill="#eef1fa" />
      {/* Question mark */}
      <Circle cx="65" cy="14" r="12" fill="#e8edf8" />
      <Path d="M62 8 Q65 5 68 8 Q71 11 65 15 L65 17" fill="none" stroke="#8a9bc5" strokeWidth="2.5" strokeLinecap="round" />
      <Circle cx="65" cy="21" r="1.8" fill="#8a9bc5" />
    </Svg>
  );
}

// ─── Empty: No Bookings ──────────────────────────────────────────────────────
export function EmptyBookingsIllustration({ size = 130 }) {
  return (
    <Svg width={size} height={size * 0.85} viewBox="0 0 130 110">
      {/* Receipt */}
      <Rect x="30" y="10" width="70" height="85" rx="8" fill="#f0f4ff" />
      {/* Zigzag bottom of receipt */}
      <Path d="M30 90 Q35 85 40 90 Q45 95 50 90 Q55 85 60 90 Q65 95 70 90 Q75 85 80 90 Q85 95 90 90 Q95 85 100 90 L100 95 L30 95Z" fill="#e8edf8" />
      {/* Lines on receipt */}
      <Rect x="40" y="24" width="50" height="5" rx="2.5" fill="#d0d8ec" />
      <Rect x="40" y="34" width="38" height="4" rx="2" fill="#e0e6f5" />
      <Rect x="40" y="44" width="45" height="4" rx="2" fill="#e0e6f5" />
      <Rect x="40" y="54" width="30" height="4" rx="2" fill="#e0e6f5" />
      {/* Big X */}
      <Circle cx="65" cy="75" r="14" fill="#fee2e2" />
      <Path d="M59 69 L71 81 M71 69 L59 81" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Empty: No Notifications ─────────────────────────────────────────────────
export function EmptyNotificationsIllustration({ size = 130 }) {
  return (
    <Svg width={size} height={size * 0.85} viewBox="0 0 130 110">
      {/* Bell */}
      <Path
        d="M65 15 Q85 18 88 42 L90 68 Q95 74 98 76 L32 76 Q35 74 40 68 L42 42 Q45 18 65 15Z"
        fill="#e8edf8"
        stroke="#d0d8ec"
        strokeWidth="1.5"
      />
      <Rect x="57" y="76" width="16" height="8" rx="4" fill="#d0d8ec" />
      <Circle cx="65" cy="88" r="8" fill="#e8edf8" stroke="#d0d8ec" strokeWidth="1.5" />
      {/* Z's for silent */}
      <Path d="M95 30 L103 30 L97 40 L105 40" fill="none" stroke="#8a9bc5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M105 18 L111 18 L107 26 L113 26" fill="none" stroke="#8a9bc5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Slash */}
      <Line x1="40" y1="28" x2="90" y2="78" stroke="#c7d7f5" strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

// ─── Empty: General ──────────────────────────────────────────────────────────
export function EmptyGeneralIllustration({ size = 130 }) {
  return (
    <Svg width={size} height={size * 0.85} viewBox="0 0 130 110">
      {/* Box */}
      <Rect x="25" y="45" width="80" height="60" rx="8" fill="#f0f4ff" stroke="#d8e2f5" strokeWidth="1.5" />
      {/* Box lid */}
      <Path d="M20 50 Q65 38 110 50 L110 58 Q65 46 20 58Z" fill="#e0e8f8" />
      <Path d="M55 44 L75 44 L78 58 L52 58Z" fill="#d0dcf0" />
      {/* Dots in box */}
      <Circle cx="52" cy="72" r="5" fill="#d0d8ec" />
      <Circle cx="65" cy="72" r="5" fill="#d0d8ec" />
      <Circle cx="78" cy="72" r="5" fill="#d0d8ec" />
      {/* Sad face */}
      <Circle cx="65" cy="20" r="16" fill="#e8edf8" />
      <Circle cx="59" cy="16" r="2" fill="#8a9bc5" />
      <Circle cx="71" cy="16" r="2" fill="#8a9bc5" />
      <Path d="M59 25 Q65 21 71 25" fill="none" stroke="#8a9bc5" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}
