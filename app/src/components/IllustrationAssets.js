// IllustrationAssets.js
// SVG XML string constants for use with react-native-svg's SvgXml component.
// Color scheme: Blue #1a73e8, Teal #00897b, Light Blue #e8f0fe, Light Teal #e0f2f1
// All illustrations use flat design style.

// ─── Splash: City skyline with a car driving ────────────────────────────────
export const splashIllustration = `<svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Sky background -->
  <rect width="400" height="320" fill="#e8f0fe" rx="16"/>
  <!-- Sun -->
  <circle cx="320" cy="60" r="40" fill="#ffd54f" opacity="0.6"/>
  <!-- Cloud 1 -->
  <ellipse cx="100" cy="70" rx="40" ry="18" fill="white" opacity="0.9"/>
  <ellipse cx="80" cy="76" rx="24" ry="16" fill="white" opacity="0.9"/>
  <ellipse cx="126" cy="76" rx="20" ry="14" fill="white" opacity="0.9"/>
  <!-- Cloud 2 -->
  <ellipse cx="260" cy="90" rx="32" ry="14" fill="white" opacity="0.7"/>
  <ellipse cx="244" cy="96" rx="18" ry="12" fill="white" opacity="0.7"/>
  <ellipse cx="278" cy="96" rx="16" ry="11" fill="white" opacity="0.7"/>
  <!-- Buildings -->
  <rect x="20" y="130" width="44" height="130" fill="#1a73e8" rx="2"/>
  <rect x="28" y="138" width="8" height="10" fill="#e8f0fe" rx="1"/>
  <rect x="40" y="138" width="8" height="10" fill="#e8f0fe" rx="1"/>
  <rect x="28" y="156" width="8" height="10" fill="#e8f0fe" rx="1"/>
  <rect x="40" y="156" width="8" height="10" fill="#e8f0fe" rx="1"/>
  <rect x="28" y="174" width="8" height="10" fill="#e8f0fe" rx="1"/>
  <rect x="40" y="174" width="8" height="10" fill="#e8f0fe" rx="1"/>
  <rect x="28" y="192" width="8" height="10" fill="#e8f0fe" rx="1"/>
  <rect x="40" y="192" width="8" height="10" fill="#e8f0fe" rx="1"/>
  <rect x="70" y="150" width="36" height="110" fill="#00897b" rx="2"/>
  <rect x="77" y="158" width="7" height="8" fill="#e0f2f1" rx="1"/>
  <rect x="88" y="158" width="7" height="8" fill="#e0f2f1" rx="1"/>
  <rect x="77" y="174" width="7" height="8" fill="#e0f2f1" rx="1"/>
  <rect x="88" y="174" width="7" height="8" fill="#e0f2f1" rx="1"/>
  <rect x="77" y="190" width="7" height="8" fill="#e0f2f1" rx="1"/>
  <rect x="88" y="190" width="7" height="8" fill="#e0f2f1" rx="1"/>
  <rect x="112" y="110" width="54" height="150" fill="#1565c0" rx="2"/>
  <rect x="120" y="118" width="10" height="12" fill="#e8f0fe" rx="1"/>
  <rect x="136" y="118" width="10" height="12" fill="#e8f0fe" rx="1"/>
  <rect x="152" y="118" width="10" height="12" fill="#e8f0fe" rx="1"/>
  <rect x="120" y="138" width="10" height="12" fill="#e8f0fe" rx="1"/>
  <rect x="136" y="138" width="10" height="12" fill="#e8f0fe" rx="1"/>
  <rect x="152" y="138" width="10" height="12" fill="#e8f0fe" rx="1"/>
  <rect x="120" y="158" width="10" height="12" fill="#e8f0fe" rx="1"/>
  <rect x="136" y="158" width="10" height="12" fill="#ffd54f" rx="1"/>
  <rect x="152" y="158" width="10" height="12" fill="#e8f0fe" rx="1"/>
  <rect x="120" y="178" width="10" height="12" fill="#e8f0fe" rx="1"/>
  <rect x="136" y="178" width="10" height="12" fill="#e8f0fe" rx="1"/>
  <rect x="152" y="178" width="10" height="12" fill="#e8f0fe" rx="1"/>
  <rect x="174" y="140" width="40" height="120" fill="#00897b" rx="2"/>
  <rect x="181" y="148" width="8" height="10" fill="#e0f2f1" rx="1"/>
  <rect x="197" y="148" width="8" height="10" fill="#e0f2f1" rx="1"/>
  <rect x="181" y="164" width="8" height="10" fill="#e0f2f1" rx="1"/>
  <rect x="197" y="164" width="8" height="10" fill="#e0f2f1" rx="1"/>
  <rect x="181" y="180" width="8" height="10" fill="#e0f2f1" rx="1"/>
  <rect x="197" y="180" width="8" height="10" fill="#ffd54f" rx="1"/>
  <rect x="222" y="120" width="50" height="140" fill="#1a73e8" rx="2"/>
  <rect x="230" y="128" width="10" height="12" fill="#e8f0fe" rx="1"/>
  <rect x="244" y="128" width="10" height="12" fill="#e8f0fe" rx="1"/>
  <rect x="258" y="128" width="10" height="12" fill="#e8f0fe" rx="1"/>
  <rect x="230" y="148" width="10" height="12" fill="#e8f0fe" rx="1"/>
  <rect x="244" y="148" width="10" height="12" fill="#ffd54f" rx="1"/>
  <rect x="258" y="148" width="10" height="12" fill="#e8f0fe" rx="1"/>
  <rect x="230" y="168" width="10" height="12" fill="#e8f0fe" rx="1"/>
  <rect x="244" y="168" width="10" height="12" fill="#e8f0fe" rx="1"/>
  <rect x="258" y="168" width="10" height="12" fill="#e8f0fe" rx="1"/>
  <rect x="280" y="155" width="36" height="105" fill="#00695c" rx="2"/>
  <rect x="288" y="163" width="7" height="9" fill="#e0f2f1" rx="1"/>
  <rect x="300" y="163" width="7" height="9" fill="#e0f2f1" rx="1"/>
  <rect x="288" y="178" width="7" height="9" fill="#e0f2f1" rx="1"/>
  <rect x="300" y="178" width="7" height="9" fill="#e0f2f1" rx="1"/>
  <rect x="322" y="135" width="58" height="125" fill="#1a73e8" rx="2"/>
  <rect x="330" y="143" width="11" height="13" fill="#e8f0fe" rx="1"/>
  <rect x="347" y="143" width="11" height="13" fill="#e8f0fe" rx="1"/>
  <rect x="364" y="143" width="11" height="13" fill="#e8f0fe" rx="1"/>
  <rect x="330" y="164" width="11" height="13" fill="#ffd54f" rx="1"/>
  <rect x="347" y="164" width="11" height="13" fill="#e8f0fe" rx="1"/>
  <rect x="364" y="164" width="11" height="13" fill="#e8f0fe" rx="1"/>
  <rect x="330" y="185" width="11" height="13" fill="#e8f0fe" rx="1"/>
  <rect x="347" y="185" width="11" height="13" fill="#e8f0fe" rx="1"/>
  <rect x="364" y="185" width="11" height="13" fill="#e8f0fe" rx="1"/>
  <!-- Road -->
  <rect x="0" y="260" width="400" height="60" fill="#546e7a"/>
  <!-- Road markings -->
  <rect x="0" y="287" width="60" height="6" fill="#ffd54f" rx="3"/>
  <rect x="80" y="287" width="60" height="6" fill="#ffd54f" rx="3"/>
  <rect x="160" y="287" width="60" height="6" fill="#ffd54f" rx="3"/>
  <rect x="240" y="287" width="60" height="6" fill="#ffd54f" rx="3"/>
  <rect x="320" y="287" width="80" height="6" fill="#ffd54f" rx="3"/>
  <!-- Sidewalk -->
  <rect x="0" y="256" width="400" height="10" fill="#b0bec5"/>
  <!-- Car body -->
  <rect x="120" y="228" width="110" height="38" fill="#1a73e8" rx="8"/>
  <path d="M136 228 Q156 208 194 208 Q220 208 234 228 Z" fill="#1565c0"/>
  <!-- Car windows -->
  <rect x="148" y="212" width="30" height="18" fill="#b3d4ff" rx="3"/>
  <rect x="184" y="212" width="30" height="18" fill="#b3d4ff" rx="3"/>
  <!-- Car wheels -->
  <circle cx="148" cy="268" r="13" fill="#263238"/>
  <circle cx="148" cy="268" r="6" fill="#90a4ae"/>
  <circle cx="210" cy="268" r="13" fill="#263238"/>
  <circle cx="210" cy="268" r="6" fill="#90a4ae"/>
  <!-- Car headlight -->
  <rect x="228" y="238" width="8" height="6" fill="#ffd54f" rx="2"/>
  <!-- Car tail light -->
  <rect x="116" y="238" width="6" height="6" fill="#ef5350" rx="2"/>
  <!-- Speed lines -->
  <line x1="80" y1="242" x2="108" y2="242" stroke="#1a73e8" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
  <line x1="70" y1="252" x2="106" y2="252" stroke="#00897b" stroke-width="2" stroke-linecap="round" opacity="0.4"/>
  <line x1="76" y1="262" x2="107" y2="262" stroke="#1a73e8" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
  <!-- Location pin above car -->
  <path d="M175 190 Q175 178 185 174 Q195 170 200 178 Q205 170 215 174 Q225 178 225 190 Q225 202 200 215 Q175 202 175 190 Z" fill="#00897b"/>
  <circle cx="200" cy="186" r="7" fill="white" opacity="0.9"/>
</svg>`;

// ─── Empty Rides: Empty road / no car found ──────────────────────────────────
export const emptyRidesIllustration = `<svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="400" height="320" fill="#eceff1" rx="16"/>
  <!-- Horizon line / scenery -->
  <rect x="0" y="200" width="400" height="120" fill="#cfd8dc"/>
  <!-- Road -->
  <path d="M140 200 L80 320 L320 320 L260 200 Z" fill="#90a4ae"/>
  <!-- Road markings -->
  <path d="M200 210 L196 240 L204 240 Z" fill="#eceff1"/>
  <path d="M200 250 L196 280 L204 280 Z" fill="#eceff1"/>
  <!-- Road border lines -->
  <line x1="140" y1="200" x2="80" y2="320" stroke="white" stroke-width="3" stroke-dasharray="12,8"/>
  <line x1="260" y1="200" x2="320" y2="320" stroke="white" stroke-width="3" stroke-dasharray="12,8"/>
  <!-- Empty road sign -->
  <rect x="166" y="100" width="68" height="68" fill="white" rx="8" opacity="0.9"/>
  <rect x="174" y="108" width="52" height="52" fill="white" rx="6"/>
  <!-- Car outline (ghost) -->
  <rect x="184" y="130" width="32" height="20" fill="none" stroke="#b0bec5" stroke-width="2.5" stroke-dasharray="4,3" rx="4"/>
  <path d="M190 130 Q198 120 210 120 Q218 120 222 130" fill="none" stroke="#b0bec5" stroke-width="2.5" stroke-dasharray="4,3"/>
  <circle cx="191" cy="152" r="5" fill="none" stroke="#b0bec5" stroke-width="2"/>
  <circle cx="215" cy="152" r="5" fill="none" stroke="#b0bec5" stroke-width="2"/>
  <!-- X mark -->
  <line x1="176" y1="166" x2="224" y2="166" stroke="#ef5350" stroke-width="3" stroke-linecap="round"/>
  <!-- Sad face / empty state person -->
  <circle cx="200" cy="52" r="28" fill="#b0bec5"/>
  <circle cx="192" cy="46" r="4" fill="white"/>
  <circle cx="208" cy="46" r="4" fill="white"/>
  <circle cx="192" cy="46" r="2" fill="#546e7a"/>
  <circle cx="208" cy="46" r="2" fill="#546e7a"/>
  <!-- Sad mouth -->
  <path d="M190 58 Q200 52 210 58" stroke="white" stroke-width="3" fill="none" stroke-linecap="round"/>
  <!-- Sweat drop -->
  <path d="M218 40 Q222 34 226 40 Q226 46 222 46 Q218 46 218 40 Z" fill="#90caf9"/>
  <!-- Search lines / binoculars -->
  <circle cx="80" cy="160" r="22" fill="none" stroke="#90a4ae" stroke-width="3" stroke-dasharray="6,4"/>
  <circle cx="120" cy="160" r="22" fill="none" stroke="#90a4ae" stroke-width="3" stroke-dasharray="6,4"/>
  <rect x="98" y="155" width="24" height="10" fill="#90a4ae" rx="4"/>
  <!-- "No rides" text substitute (decorative bars) -->
  <rect x="290" y="120" width="80" height="8" fill="#b0bec5" rx="4"/>
  <rect x="290" y="136" width="60" height="8" fill="#cfd8dc" rx="4"/>
  <rect x="290" y="152" width="70" height="8" fill="#b0bec5" rx="4"/>
  <!-- Tumbleweed circles -->
  <circle cx="348" cy="196" r="12" fill="none" stroke="#b0bec5" stroke-width="2"/>
  <line x1="348" y1="184" x2="348" y2="208" stroke="#b0bec5" stroke-width="1.5"/>
  <line x1="336" y1="196" x2="360" y2="196" stroke="#b0bec5" stroke-width="1.5"/>
  <line x1="340" y1="188" x2="356" y2="204" stroke="#b0bec5" stroke-width="1.5"/>
  <line x1="356" y1="188" x2="340" y2="204" stroke="#b0bec5" stroke-width="1.5"/>
</svg>`;

// ─── Empty Bookings: Empty calendar / no bookings ───────────────────────────
export const emptyBookingsIllustration = `<svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="400" height="320" fill="#e8f0fe" rx="16"/>
  <!-- Calendar -->
  <rect x="80" y="70" width="240" height="210" fill="white" rx="16" opacity="0.95"/>
  <!-- Calendar header -->
  <rect x="80" y="70" width="240" height="56" fill="#1a73e8" rx="16"/>
  <rect x="80" y="102" width="240" height="24" fill="#1a73e8"/>
  <!-- Calendar rings -->
  <rect x="130" y="58" width="14" height="30" fill="#1565c0" rx="7"/>
  <rect x="256" y="58" width="14" height="30" fill="#1565c0" rx="7"/>
  <!-- Calendar title area -->
  <rect x="152" y="83" width="96" height="10" fill="white" rx="4" opacity="0.5"/>
  <!-- Day labels -->
  <rect x="96" y="138" width="20" height="7" fill="#b0bec5" rx="3"/>
  <rect x="126" y="138" width="20" height="7" fill="#b0bec5" rx="3"/>
  <rect x="156" y="138" width="20" height="7" fill="#b0bec5" rx="3"/>
  <rect x="186" y="138" width="20" height="7" fill="#b0bec5" rx="3"/>
  <rect x="216" y="138" width="20" height="7" fill="#b0bec5" rx="3"/>
  <rect x="246" y="138" width="20" height="7" fill="#b0bec5" rx="3"/>
  <rect x="276" y="138" width="20" height="7" fill="#b0bec5" rx="3"/>
  <!-- Day cells - all empty/muted -->
  <rect x="96" y="158" width="20" height="20" fill="#eceff1" rx="4"/>
  <rect x="126" y="158" width="20" height="20" fill="#eceff1" rx="4"/>
  <rect x="156" y="158" width="20" height="20" fill="#eceff1" rx="4"/>
  <rect x="186" y="158" width="20" height="20" fill="#eceff1" rx="4"/>
  <rect x="216" y="158" width="20" height="20" fill="#eceff1" rx="4"/>
  <rect x="246" y="158" width="20" height="20" fill="#eceff1" rx="4"/>
  <rect x="276" y="158" width="20" height="20" fill="#eceff1" rx="4"/>
  <rect x="96" y="186" width="20" height="20" fill="#eceff1" rx="4"/>
  <rect x="126" y="186" width="20" height="20" fill="#eceff1" rx="4"/>
  <rect x="156" y="186" width="20" height="20" fill="#eceff1" rx="4"/>
  <rect x="186" y="186" width="20" height="20" fill="#eceff1" rx="4"/>
  <rect x="216" y="186" width="20" height="20" fill="#eceff1" rx="4"/>
  <rect x="246" y="186" width="20" height="20" fill="#eceff1" rx="4"/>
  <rect x="276" y="186" width="20" height="20" fill="#eceff1" rx="4"/>
  <rect x="96" y="214" width="20" height="20" fill="#eceff1" rx="4"/>
  <rect x="126" y="214" width="20" height="20" fill="#eceff1" rx="4"/>
  <rect x="156" y="214" width="20" height="20" fill="#eceff1" rx="4"/>
  <rect x="186" y="214" width="20" height="20" fill="#eceff1" rx="4"/>
  <rect x="216" y="214" width="20" height="20" fill="#eceff1" rx="4"/>
  <rect x="246" y="214" width="20" height="20" fill="#eceff1" rx="4"/>
  <rect x="276" y="214" width="20" height="20" fill="#eceff1" rx="4"/>
  <rect x="96" y="242" width="20" height="20" fill="#eceff1" rx="4"/>
  <rect x="126" y="242" width="20" height="20" fill="#eceff1" rx="4"/>
  <rect x="156" y="242" width="20" height="20" fill="#eceff1" rx="4"/>
  <!-- Floating question mark person -->
  <circle cx="340" cy="120" r="26" fill="#e8f0fe"/>
  <circle cx="340" cy="104" r="12" fill="#b0bec5"/>
  <ellipse cx="340" cy="136" rx="18" ry="10" fill="#b0bec5"/>
  <!-- Magnifying glass over calendar -->
  <circle cx="56" cy="200" r="28" fill="none" stroke="#1a73e8" stroke-width="4" opacity="0.5"/>
  <line x1="77" y1="221" x2="92" y2="236" stroke="#1a73e8" stroke-width="5" stroke-linecap="round" opacity="0.5"/>
  <!-- Empty / no entry symbol -->
  <circle cx="340" cy="222" r="22" fill="none" stroke="#ef5350" stroke-width="4"/>
  <line x1="324" y1="206" x2="356" y2="238" stroke="#ef5350" stroke-width="4" stroke-linecap="round"/>
  <!-- Decorative dots -->
  <circle cx="44" cy="100" r="5" fill="#1a73e8" opacity="0.3"/>
  <circle cx="360" cy="290" r="8" fill="#00897b" opacity="0.3"/>
  <circle cx="36" cy="270" r="10" fill="#1a73e8" opacity="0.2"/>
</svg>`;

export const emptyNotificationsIllustration = `<svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="320" fill="#e8f0fe" rx="16"/>
  <rect x="100" y="60" width="200" height="180" rx="20" fill="white" opacity="0.7"/>
  <path d="M200 80 Q240 85 244 120 L248 170 Q255 180 260 184 L140 184 Q145 180 152 170 L156 120 Q160 85 200 80Z" fill="#1a73e8" opacity="0.15" stroke="#1a73e8" stroke-width="2"/>
  <rect x="182" y="184" width="36" height="14" rx="7" fill="#1a73e8" opacity="0.3"/>
  <circle cx="200" cy="202" r="10" fill="#1a73e8" opacity="0.2"/>
  <line x1="168" y1="100" x2="232" y2="184" stroke="#ef4444" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
  <line x1="232" y1="100" x2="168" y2="184" stroke="#ef4444" stroke-width="3" stroke-linecap="round" opacity="0.6"/>
  <circle cx="310" cy="100" r="18" fill="#e0f2f1"/>
  <text x="310" y="107" text-anchor="middle" font-size="18" fill="#00897b" font-weight="bold">Z</text>
  <circle cx="340" cy="70" r="12" fill="#e0f2f1"/>
  <text x="340" y="76" text-anchor="middle" font-size="12" fill="#00897b" font-weight="bold">Z</text>
  <circle cx="90" cy="220" r="22" fill="#e8f0fe"/>
  <rect x="78" y="212" width="24" height="16" rx="3" fill="#1a73e8" opacity="0.3"/>
  <line x1="82" y1="218" x2="102" y2="218" stroke="#1a73e8" stroke-width="2"/>
  <line x1="82" y1="222" x2="96" y2="222" stroke="#1a73e8" stroke-width="2"/>
</svg>`;

export const emptyGeneralIllustration = `<svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="320" fill="#e8f0fe" rx="16"/>
  <rect x="120" y="120" width="160" height="130" rx="12" fill="white" opacity="0.8"/>
  <path d="M120 136 Q200 112 280 136 L280 148 Q200 124 120 148Z" fill="#e0f2f1"/>
  <rect x="148" y="156" width="104" height="8" rx="4" fill="#1a73e8" opacity="0.25"/>
  <rect x="148" y="170" width="80" height="6" rx="3" fill="#00897b" opacity="0.2"/>
  <rect x="148" y="182" width="92" height="6" rx="3" fill="#00897b" opacity="0.2"/>
  <rect x="148" y="194" width="68" height="6" rx="3" fill="#00897b" opacity="0.15"/>
  <circle cx="200" cy="90" r="28" fill="white" opacity="0.9"/>
  <circle cx="193" cy="85" r="4" fill="#1a73e8" opacity="0.6"/>
  <circle cx="207" cy="85" r="4" fill="#1a73e8" opacity="0.6"/>
  <path d="M191 98 Q200 92 209 98" fill="none" stroke="#1a73e8" stroke-width="2.5" stroke-linecap="round" opacity="0.6"/>
</svg>`;

// ─────────────────────────────────────────────────────────────────────────────
// Default export map for convenience
// ─────────────────────────────────────────────────────────────────────────────
export default {
  splashIllustration, emptyRidesIllustration,
  emptyBookingsIllustration, emptyNotificationsIllustration,
  emptyGeneralIllustration
};
