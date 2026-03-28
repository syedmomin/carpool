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

// ─── Search: Person searching on phone / map with pins ──────────────────────
export const searchIllustration = `<svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="400" height="320" fill="#e0f2f1" rx="16"/>
  <!-- Map base -->
  <rect x="40" y="60" width="240" height="200" fill="white" rx="12" opacity="0.95"/>
  <!-- Map grid lines -->
  <line x1="40" y1="110" x2="280" y2="110" stroke="#e0f2f1" stroke-width="2"/>
  <line x1="40" y1="160" x2="280" y2="160" stroke="#e0f2f1" stroke-width="2"/>
  <line x1="40" y1="210" x2="280" y2="210" stroke="#e0f2f1" stroke-width="2"/>
  <line x1="100" y1="60" x2="100" y2="260" stroke="#e0f2f1" stroke-width="2"/>
  <line x1="160" y1="60" x2="160" y2="260" stroke="#e0f2f1" stroke-width="2"/>
  <line x1="220" y1="60" x2="220" y2="260" stroke="#e0f2f1" stroke-width="2"/>
  <!-- Map roads -->
  <rect x="40" y="130" width="240" height="10" fill="#b0bec5" rx="2" opacity="0.6"/>
  <rect x="120" y="60" width="10" height="200" fill="#b0bec5" rx="2" opacity="0.6"/>
  <rect x="40" y="190" width="160" height="8" fill="#b0bec5" rx="2" opacity="0.5"/>
  <!-- Map route path -->
  <polyline points="80,240 80,135 200,135 200,100" stroke="#1a73e8" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="8,4"/>
  <!-- Origin pin -->
  <circle cx="80" cy="244" r="10" fill="#00897b"/>
  <circle cx="80" cy="244" r="5" fill="white"/>
  <!-- Destination pin -->
  <path d="M192 100 Q192 88 200 84 Q208 80 212 88 Q216 80 224 84 Q232 88 232 100 Q232 112 200 124 Q192 108 192 100 Z" fill="#ef5350"/>
  <circle cx="210" cy="97" r="6" fill="white" opacity="0.9"/>
  <!-- Search circle (magnifying glass) -->
  <circle cx="316" cy="140" r="54" fill="white" opacity="0.95"/>
  <circle cx="316" cy="136" r="36" fill="none" stroke="#1a73e8" stroke-width="5"/>
  <circle cx="316" cy="136" r="26" fill="#e8f0fe"/>
  <!-- Mini map inside lens -->
  <circle cx="308" cy="132" r="5" fill="#00897b"/>
  <circle cx="324" cy="126" r="5" fill="#ef5350"/>
  <line x1="308" y1="132" x2="324" y2="126" stroke="#1a73e8" stroke-width="2" stroke-dasharray="3,2"/>
  <!-- Magnifying glass handle -->
  <line x1="343" y1="163" x2="362" y2="182" stroke="#1a73e8" stroke-width="6" stroke-linecap="round"/>
  <!-- Person silhouette -->
  <circle cx="316" cy="248" r="18" fill="#1a73e8"/>
  <ellipse cx="316" cy="290" rx="26" ry="16" fill="#1a73e8"/>
  <circle cx="316" cy="230" r="10" fill="#ffcc80"/>
  <!-- Phone in hand -->
  <rect x="330" y="252" width="20" height="32" fill="#263238" rx="3"/>
  <rect x="333" y="255" width="14" height="22" fill="#4fc3f7" rx="2"/>
  <!-- Floating cards -->
  <rect x="290" y="60" width="90" height="36" fill="white" rx="8" opacity="0.95"/>
  <circle cx="308" cy="78" r="8" fill="#e8f0fe"/>
  <circle cx="308" cy="78" r="4" fill="#1a73e8"/>
  <rect x="322" y="72" width="48" height="5" fill="#b0bec5" rx="2"/>
  <rect x="322" y="81" width="36" height="4" fill="#e0e0e0" rx="2"/>
</svg>`;

// ─── Share Ride: Two people in a car together ───────────────────────────────
export const shareRideIllustration = `<svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="400" height="320" fill="#e8f0fe" rx="16"/>
  <!-- Road -->
  <rect x="0" y="240" width="400" height="80" fill="#546e7a"/>
  <rect x="0" y="235" width="400" height="10" fill="#78909c"/>
  <!-- Road dashes -->
  <rect x="10" y="276" width="50" height="6" fill="#ffd54f" rx="3"/>
  <rect x="80" y="276" width="50" height="6" fill="#ffd54f" rx="3"/>
  <rect x="150" y="276" width="50" height="6" fill="#ffd54f" rx="3"/>
  <rect x="220" y="276" width="50" height="6" fill="#ffd54f" rx="3"/>
  <rect x="290" y="276" width="50" height="6" fill="#ffd54f" rx="3"/>
  <rect x="350" y="276" width="50" height="6" fill="#ffd54f" rx="3"/>
  <!-- Car body -->
  <rect x="60" y="195" width="280" height="55" fill="#1a73e8" rx="14"/>
  <!-- Car roof -->
  <path d="M110 195 Q140 155 200 152 Q260 155 290 195 Z" fill="#1565c0"/>
  <!-- Windshield -->
  <path d="M142 195 Q158 165 200 162 Q242 165 258 195 Z" fill="#b3d4ff" opacity="0.9"/>
  <!-- Side windows -->
  <rect x="110" y="165" width="34" height="30" fill="#b3d4ff" rx="4" opacity="0.9"/>
  <rect x="256" y="165" width="34" height="30" fill="#b3d4ff" rx="4" opacity="0.9"/>
  <!-- Person 1 in car (driver) -->
  <circle cx="128" cy="175" r="10" fill="#ffcc80"/>
  <rect x="120" y="183" width="16" height="12" fill="#00897b" rx="2"/>
  <!-- Person 2 in car (passenger) -->
  <circle cx="272" cy="175" r="10" fill="#ffb74d"/>
  <rect x="264" y="183" width="16" height="12" fill="#1a73e8" rx="2"/>
  <!-- Sharing icons between them -->
  <circle cx="200" cy="178" r="14" fill="white" opacity="0.9"/>
  <text x="200" y="183" text-anchor="middle" font-size="14" fill="#00897b">+</text>
  <!-- Car wheels -->
  <circle cx="120" cy="252" r="20" fill="#263238"/>
  <circle cx="120" cy="252" r="9" fill="#90a4ae"/>
  <circle cx="280" cy="252" r="20" fill="#263238"/>
  <circle cx="280" cy="252" r="9" fill="#90a4ae"/>
  <!-- Headlights -->
  <rect x="334" y="207" width="14" height="10" fill="#ffd54f" rx="3"/>
  <ellipse cx="348" cy="212" rx="8" ry="6" fill="#fff9c4" opacity="0.7"/>
  <!-- Tail lights -->
  <rect x="52" y="207" width="12" height="10" fill="#ef5350" rx="3"/>
  <!-- Speed lines -->
  <line x1="10" y1="215" x2="50" y2="215" stroke="#1a73e8" stroke-width="4" stroke-linecap="round" opacity="0.5"/>
  <line x1="4" y1="228" x2="48" y2="228" stroke="#00897b" stroke-width="3" stroke-linecap="round" opacity="0.4"/>
  <!-- Location pins on roof -->
  <path d="M178 145 Q178 134 186 130 Q194 126 198 133 Q202 126 210 130 Q218 134 218 145 Q218 156 198 166 Q178 156 178 145 Z" fill="#00897b"/>
  <circle cx="198" cy="142" r="6" fill="white" opacity="0.9"/>
  <!-- Trees / environment -->
  <circle cx="30" cy="215" r="22" fill="#66bb6a"/>
  <rect x="26" y="228" width="8" height="18" fill="#5d4037"/>
  <circle cx="370" cy="210" r="26" fill="#43a047"/>
  <rect x="366" y="226" width="8" height="20" fill="#5d4037"/>
  <!-- Sun -->
  <circle cx="360" cy="55" r="30" fill="#ffd54f" opacity="0.7"/>
  <!-- Clouds -->
  <ellipse cx="120" cy="50" rx="36" ry="16" fill="white" opacity="0.9"/>
  <ellipse cx="102" cy="56" rx="22" ry="14" fill="white" opacity="0.9"/>
  <ellipse cx="144" cy="56" rx="18" ry="12" fill="white" opacity="0.9"/>
</svg>`;

// ─── Safety: Shield with checkmark and verified badge ───────────────────────
export const safetyIllustration = `<svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="400" height="320" fill="#e0f2f1" rx="16"/>
  <!-- Decorative circles -->
  <circle cx="200" cy="160" r="130" fill="#b2dfdb" opacity="0.3"/>
  <circle cx="200" cy="160" r="100" fill="#80cbc4" opacity="0.2"/>
  <!-- Main shield -->
  <path d="M200 40 L320 80 L320 170 Q320 240 200 290 Q80 240 80 170 L80 80 Z" fill="url(#shieldGrad)"/>
  <path d="M200 56 L308 90 L308 170 Q308 232 200 276 Q92 232 92 170 L92 90 Z" fill="#00897b" opacity="0.15"/>
  <!-- Shield inner highlight -->
  <path d="M200 62 L300 94 L300 170 Q300 228 200 270 Q100 228 100 170 L100 94 Z" fill="none" stroke="white" stroke-width="2" opacity="0.4"/>
  <!-- Checkmark -->
  <polyline points="148,165 182,200 254,128" stroke="white" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Stars / sparkles -->
  <circle cx="340" cy="70" r="5" fill="#ffd54f"/>
  <circle cx="356" cy="50" r="3" fill="#ffd54f" opacity="0.7"/>
  <circle cx="325" cy="48" r="3" fill="#ffd54f" opacity="0.7"/>
  <circle cx="60" cy="90" r="5" fill="#ffd54f"/>
  <circle cx="44" cy="70" r="3" fill="#ffd54f" opacity="0.7"/>
  <circle cx="76" cy="68" r="3" fill="#ffd54f" opacity="0.7"/>
  <!-- Verified badge bottom right of shield -->
  <circle cx="284" cy="248" r="26" fill="#1a73e8"/>
  <circle cx="284" cy="248" r="20" fill="white"/>
  <polyline points="274,248 281,256 295,240" stroke="#1a73e8" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Lock icon top of shield -->
  <rect x="182" y="70" width="36" height="28" fill="#00897b" rx="4"/>
  <path d="M189 70 Q189 56 200 56 Q211 56 211 70" stroke="#00897b" stroke-width="5" fill="none"/>
  <circle cx="200" cy="84" r="5" fill="white"/>
  <!-- Small floating badges -->
  <rect x="40" y="160" width="64" height="28" fill="white" rx="14" opacity="0.95"/>
  <circle cx="57" cy="174" r="8" fill="#00897b"/>
  <polyline points="53,174 56,178 62,169" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="68" y="170" width="28" height="5" fill="#b0bec5" rx="2"/>
  <rect x="296" y="150" width="64" height="28" fill="white" rx="14" opacity="0.95"/>
  <circle cx="313" cy="164" r="8" fill="#1a73e8"/>
  <polyline points="309,164 312,168 318,159" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="324" y="160" width="28" height="5" fill="#b0bec5" rx="2"/>
  <!-- Gradient def -->
  <defs>
    <linearGradient id="shieldGrad" x1="200" y1="40" x2="200" y2="290" gradientUnits="userSpaceOnUse">
      <stop stop-color="#00897b"/>
      <stop offset="1" stop-color="#004d40"/>
    </linearGradient>
  </defs>
</svg>`;

// ─── Affordable: Coins, money, wallet, and piggy bank ───────────────────────
export const affordableIllustration = `<svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="400" height="320" fill="#e8f0fe" rx="16"/>
  <!-- Coin stack 1 -->
  <ellipse cx="80" cy="240" rx="34" ry="10" fill="#f9a825"/>
  <rect x="46" y="220" width="68" height="20" fill="#fbc02d"/>
  <ellipse cx="80" cy="220" rx="34" ry="10" fill="#ffd54f"/>
  <rect x="46" y="200" width="68" height="20" fill="#fbc02d"/>
  <ellipse cx="80" cy="200" rx="34" ry="10" fill="#ffd54f"/>
  <rect x="46" y="180" width="68" height="20" fill="#fbc02d"/>
  <ellipse cx="80" cy="180" rx="34" ry="10" fill="#ffd54f"/>
  <!-- Dollar sign on coin -->
  <text x="80" y="184" text-anchor="middle" font-size="12" font-weight="bold" fill="#f57f17">$</text>
  <!-- Coin stack 2 (shorter) -->
  <ellipse cx="160" cy="240" rx="26" ry="8" fill="#f9a825"/>
  <rect x="134" y="222" width="52" height="18" fill="#fbc02d"/>
  <ellipse cx="160" cy="222" rx="26" ry="8" fill="#ffd54f"/>
  <rect x="134" y="205" width="52" height="17" fill="#fbc02d"/>
  <ellipse cx="160" cy="205" rx="26" ry="8" fill="#ffd54f"/>
  <text x="160" y="209" text-anchor="middle" font-size="10" font-weight="bold" fill="#f57f17">$</text>
  <!-- Wallet -->
  <rect x="220" y="150" width="130" height="100" fill="#1a73e8" rx="12"/>
  <rect x="220" y="150" width="130" height="30" fill="#1565c0" rx="12"/>
  <!-- Wallet clasp -->
  <rect x="320" y="170" width="36" height="50" fill="#1565c0" rx="18"/>
  <circle cx="338" cy="195" r="14" fill="#0d47a1"/>
  <circle cx="338" cy="195" r="8" fill="#1a73e8"/>
  <!-- Bills in wallet -->
  <rect x="232" y="196" width="80" height="16" fill="#43a047" rx="4"/>
  <rect x="232" y="218" width="80" height="16" fill="#66bb6a" rx="4"/>
  <text x="272" y="207" text-anchor="middle" font-size="8" fill="white">$ 5 0</text>
  <!-- Piggy bank -->
  <ellipse cx="320" cy="100" rx="50" ry="44" fill="#f48fb1"/>
  <!-- Piggy snout -->
  <ellipse cx="358" cy="108" rx="16" ry="12" fill="#f06292"/>
  <circle cx="354" cy="108" r="3" fill="#ad1457"/>
  <circle cx="362" cy="108" r="3" fill="#ad1457"/>
  <!-- Piggy eye -->
  <circle cx="342" cy="88" r="5" fill="white"/>
  <circle cx="342" cy="88" r="2.5" fill="#263238"/>
  <!-- Piggy ear -->
  <ellipse cx="296" cy="66" rx="12" ry="16" fill="#f48fb1" transform="rotate(-20 296 66)"/>
  <ellipse cx="296" cy="66" rx="7" ry="10" fill="#f06292" transform="rotate(-20 296 66)"/>
  <!-- Piggy tail -->
  <path d="M270 105 Q256 98 260 88 Q264 78 274 82" stroke="#f06292" stroke-width="4" fill="none" stroke-linecap="round"/>
  <!-- Slot on piggy bank -->
  <rect x="308" y="62" width="20" height="5" fill="#ad1457" rx="2"/>
  <!-- Coin going in -->
  <ellipse cx="318" cy="56" rx="10" ry="10" fill="#ffd54f"/>
  <text x="318" y="60" text-anchor="middle" font-size="9" font-weight="bold" fill="#f57f17">$</text>
  <!-- Legs -->
  <rect x="296" y="138" width="12" height="22" fill="#f48fb1" rx="6"/>
  <rect x="316" y="138" width="12" height="22" fill="#f48fb1" rx="6"/>
  <rect x="336" y="138" width="12" height="22" fill="#f48fb1" rx="6"/>
  <!-- Down arrow / affordable label area -->
  <circle cx="200" cy="100" r="28" fill="#00897b"/>
  <polyline points="200,86 200,110 190,100" stroke="white" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="200" y1="110" x2="212" y2="100" stroke="white" stroke-width="4" stroke-linecap="round"/>
  <!-- Floating coins -->
  <circle cx="150" cy="80" r="12" fill="#ffd54f" opacity="0.8"/>
  <text x="150" y="84" text-anchor="middle" font-size="10" font-weight="bold" fill="#f57f17">$</text>
  <circle cx="50" cy="130" r="10" fill="#ffd54f" opacity="0.7"/>
  <text x="50" y="134" text-anchor="middle" font-size="9" font-weight="bold" fill="#f57f17">$</text>
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

// ─── Schedule: Calendar with clock, planning a journey ──────────────────────
export const scheduleIllustration = `<svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="400" height="320" fill="#e0f2f1" rx="16"/>
  <!-- Main calendar card -->
  <rect x="50" y="50" width="220" height="230" fill="white" rx="16" opacity="0.97"/>
  <!-- Calendar header -->
  <rect x="50" y="50" width="220" height="60" fill="#00897b" rx="16"/>
  <rect x="50" y="90" width="220" height="20" fill="#00897b"/>
  <!-- Rings -->
  <rect x="96" y="38" width="12" height="28" fill="#00695c" rx="6"/>
  <rect x="212" y="38" width="12" height="28" fill="#00695c" rx="6"/>
  <!-- Month label -->
  <rect x="110" y="68" width="100" height="10" fill="white" rx="4" opacity="0.5"/>
  <!-- Day headers -->
  <rect x="64" y="124" width="16" height="6" fill="#b0bec5" rx="2"/>
  <rect x="90" y="124" width="16" height="6" fill="#b0bec5" rx="2"/>
  <rect x="116" y="124" width="16" height="6" fill="#b0bec5" rx="2"/>
  <rect x="142" y="124" width="16" height="6" fill="#b0bec5" rx="2"/>
  <rect x="168" y="124" width="16" height="6" fill="#b0bec5" rx="2"/>
  <rect x="194" y="124" width="16" height="6" fill="#b0bec5" rx="2"/>
  <rect x="220" y="124" width="16" height="6" fill="#b0bec5" rx="2"/>
  <!-- Day cells -->
  <rect x="64" y="140" width="18" height="18" fill="#eceff1" rx="4"/>
  <rect x="90" y="140" width="18" height="18" fill="#eceff1" rx="4"/>
  <rect x="116" y="140" width="18" height="18" fill="#eceff1" rx="4"/>
  <!-- Highlighted day -->
  <rect x="142" y="140" width="18" height="18" fill="#00897b" rx="4"/>
  <rect x="168" y="140" width="18" height="18" fill="#eceff1" rx="4"/>
  <rect x="194" y="140" width="18" height="18" fill="#eceff1" rx="4"/>
  <rect x="220" y="140" width="18" height="18" fill="#eceff1" rx="4"/>
  <rect x="64" y="166" width="18" height="18" fill="#eceff1" rx="4"/>
  <rect x="90" y="166" width="18" height="18" fill="#eceff1" rx="4"/>
  <rect x="116" y="166" width="18" height="18" fill="#eceff1" rx="4"/>
  <rect x="142" y="166" width="18" height="18" fill="#eceff1" rx="4"/>
  <!-- Another highlighted day -->
  <rect x="168" y="166" width="18" height="18" fill="#1a73e8" rx="4"/>
  <rect x="194" y="166" width="18" height="18" fill="#eceff1" rx="4"/>
  <rect x="220" y="166" width="18" height="18" fill="#eceff1" rx="4"/>
  <rect x="64" y="192" width="18" height="18" fill="#eceff1" rx="4"/>
  <rect x="90" y="192" width="18" height="18" fill="#eceff1" rx="4"/>
  <!-- Event dots on cells -->
  <circle cx="73" cy="206" r="3" fill="#00897b"/>
  <rect x="116" y="192" width="18" height="18" fill="#eceff1" rx="4"/>
  <rect x="142" y="192" width="18" height="18" fill="#eceff1" rx="4"/>
  <rect x="168" y="192" width="18" height="18" fill="#eceff1" rx="4"/>
  <rect x="194" y="192" width="18" height="18" fill="#e8f0fe" rx="4"/>
  <circle cx="203" cy="201" r="3" fill="#1a73e8"/>
  <rect x="220" y="192" width="18" height="18" fill="#eceff1" rx="4"/>
  <rect x="64" y="218" width="18" height="18" fill="#eceff1" rx="4"/>
  <rect x="90" y="218" width="18" height="18" fill="#eceff1" rx="4"/>
  <rect x="116" y="218" width="18" height="18" fill="#eceff1" rx="4"/>
  <rect x="142" y="218" width="18" height="18" fill="#eceff1" rx="4"/>
  <rect x="168" y="218" width="18" height="18" fill="#eceff1" rx="4"/>
  <!-- Event bars below calendar -->
  <rect x="64" y="246" width="180" height="8" fill="#e0f2f1" rx="4"/>
  <rect x="64" y="246" width="100" height="8" fill="#00897b" rx="4"/>
  <rect x="64" y="258" width="180" height="8" fill="#e8f0fe" rx="4"/>
  <rect x="64" y="258" width="140" height="8" fill="#1a73e8" rx="4"/>
  <!-- Clock -->
  <circle cx="310" cy="140" r="70" fill="white" opacity="0.95"/>
  <circle cx="310" cy="140" r="62" fill="white"/>
  <circle cx="310" cy="140" r="56" fill="none" stroke="#00897b" stroke-width="4"/>
  <!-- Clock hour markers -->
  <line x1="310" y1="88" x2="310" y2="98" stroke="#00897b" stroke-width="3" stroke-linecap="round"/>
  <line x1="362" y1="140" x2="352" y2="140" stroke="#00897b" stroke-width="3" stroke-linecap="round"/>
  <line x1="310" y1="192" x2="310" y2="182" stroke="#00897b" stroke-width="3" stroke-linecap="round"/>
  <line x1="258" y1="140" x2="268" y2="140" stroke="#00897b" stroke-width="3" stroke-linecap="round"/>
  <!-- Minor markers -->
  <line x1="336" y1="93" x2="332" y2="100" stroke="#b0bec5" stroke-width="2" stroke-linecap="round"/>
  <line x1="357" y1="114" x2="350" y2="118" stroke="#b0bec5" stroke-width="2" stroke-linecap="round"/>
  <line x1="357" y1="166" x2="350" y2="162" stroke="#b0bec5" stroke-width="2" stroke-linecap="round"/>
  <line x1="284" y1="93" x2="288" y2="100" stroke="#b0bec5" stroke-width="2" stroke-linecap="round"/>
  <line x1="263" y1="114" x2="270" y2="118" stroke="#b0bec5" stroke-width="2" stroke-linecap="round"/>
  <!-- Clock hands -->
  <line x1="310" y1="140" x2="310" y2="104" stroke="#1a73e8" stroke-width="4" stroke-linecap="round"/>
  <line x1="310" y1="140" x2="336" y2="152" stroke="#00897b" stroke-width="3" stroke-linecap="round"/>
  <circle cx="310" cy="140" r="5" fill="#1a73e8"/>
  <!-- Alarm bell icon at bottom of clock -->
  <path d="M296 214 Q296 204 310 200 Q324 204 324 214 L328 222 H292 Z" fill="#1a73e8"/>
  <rect x="304" y="222" width="12" height="5" fill="#1565c0" rx="2"/>
  <circle cx="310" cy="228" r="4" fill="#1565c0"/>
  <!-- Location pin connecting calendar to clock -->
  <path d="M270 160 Q280 155 290 150" stroke="#00897b" stroke-width="2" stroke-dasharray="4,3" stroke-linecap="round"/>
  <circle cx="270" cy="160" r="5" fill="#00897b"/>
  <circle cx="290" cy="150" r="5" fill="#1a73e8"/>
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
  splashIllustration, searchIllustration, shareRideIllustration,
  safetyIllustration, affordableIllustration, emptyRidesIllustration,
  emptyBookingsIllustration, emptyNotificationsIllustration,
  emptyGeneralIllustration, scheduleIllustration,
};
