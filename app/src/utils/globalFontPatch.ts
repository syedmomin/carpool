import { StyleSheet } from 'react-native';

// ── Global Inter font ────────────────────────────────────────────────────────
// The design system specifies Inter everywhere, but ~30 screens already write
// plain `fontWeight: '700'` etc. without a fontFamily (RN's default behavior
// on the system font). Custom fonts loaded via expo-font don't respond to
// `fontWeight` — each weight is its own font file — so retrofitting every
// screen isn't practical.
//
// This patches `StyleSheet.create` — a real identity function every screen
// already calls (`create(obj) { return obj }`, verified against
// node_modules/react-native/Libraries/StyleSheet/StyleSheetExports.js) — to
// inject the matching Inter fontFamily directly into each text-like style
// object before RN freezes it. Since <Text style={styles.x}> reads
// style.fontFamily directly, this reaches the goal without depending on
// <Text>'s internal implementation (which, on RN 0.81 / React 19, is a plain
// function component with no static `.render` and no function-component
// defaultProps support — the classic "patch Text.render" trick used on older
// RN is a silent no-op here).
//
// Must run before ANY screen module is imported (their top-level
// `StyleSheet.create({...})` calls execute at import time), which is why
// this is called from index.tsx via a dynamic require() for `./App`, not
// from inside App.tsx itself — static imports are hoisted, so by the time
// App.tsx's own code runs, every screen it (transitively) imports has
// already called the *unpatched* StyleSheet.create.
//
// The mapping is shifted one step lighter than a literal weight match: Inter's
// true Bold (700) reads visibly heavier than iOS/Android system-font bold did
// at the same numeric weight, and `fontWeight: '700'` is used pervasively
// across the app for ordinary titles/labels (not just hero text). Screens that
// want true Inter Bold can still set fontFamily explicitly (e.g. FONTS.bold on
// auth screens) — that bypasses this mapping entirely.
function pickInterFamily(fontWeight: any): string {
  const w = String(fontWeight ?? '400');
  if (w === '700' || w === '800' || w === '900' || w === 'bold') return 'Inter_600SemiBold';
  if (w === '600' || w === '500') return 'Inter_500Medium';
  return 'Inter_400Regular';
}

// Property names that indicate "this style object is meant for a <Text>"
// (or contains text-styling), so we don't tag pure layout/View styles.
const TEXT_STYLE_HINTS = [
  'fontSize', 'fontWeight', 'fontStyle', 'color', 'textAlign', 'lineHeight',
  'letterSpacing', 'textTransform', 'textDecorationLine',
];

let patched = false;
export function patchStyleSheetWithInter() {
  if (patched) return;
  patched = true;
  const originalCreate = StyleSheet.create;
  (StyleSheet as any).create = function (obj: any) {
    for (const key in obj) {
      const s = obj[key];
      if (s && typeof s === 'object' && !s.fontFamily && TEXT_STYLE_HINTS.some(k => s[k] !== undefined)) {
        s.fontFamily = pickInterFamily(s.fontWeight);
      }
    }
    return originalCreate.call(StyleSheet, obj);
  };
}
