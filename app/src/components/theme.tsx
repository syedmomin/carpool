import { Platform, StyleSheet } from 'react-native';

// ─── FONTS (Poppins, loaded in App.tsx via @expo-google-fonts/poppins) ──────
// Custom fonts don't respond to the `fontWeight` style prop — each weight is
// its own font file, so use these fontFamily names instead of fontWeight.
export const FONTS = {
  regular:   'Poppins_400Regular',
  medium:    'Poppins_500Medium',
  semiBold:  'Poppins_600SemiBold',
  bold:      'Poppins_700Bold',
  extraBold: 'Poppins_800ExtraBold',
};

// Rounded/bubbly — matches the brand mark's own baked-in lettering. Use for
// headlines, taglines, and buttons on the auth screens; NOT for dense body
// copy or small labels (a rounded face reads poorly at small sizes).
export const HEADING_FONTS = {
  semiBold:  'Baloo2_600SemiBold',
  bold:      'Baloo2_700Bold',
  extraBold: 'Baloo2_800ExtraBold',
};

// ─── ChalParo Brand Palette ───────────────────────────────────────────────
// Rule: passenger UI = primary blue | driver UI = teal (unified to brand blue)
// Never use purple — was replaced with blue
export const COLORS = {
  // ── Core brand
  primary:       '#1a73e8',   // passenger CTA, general links
  primaryDark:   '#1557b0',
  primaryLight:  '#e8f0fe',

  // ── Driver accent (unified to brand blue)
  teal:          '#1a73e8',
  tealDark:      '#1557b0',
  tealLight:     '#e8f0fe',

  // ── Status
  secondary:     '#2e7d32',   // success, verified
  secondaryDark: '#1b5e20',
  danger:        '#e53935',
  dangerLight:   '#ffebee',
  warning:       '#f59e0b',
  warningLight:  '#fffbeb',
  accent:        '#f59e0b',   // alias for warning

  // ── Neutrals
  white:         '#ffffff',
  black:         '#0d0d0d',
  gray:          '#6b7280',
  lightGray:     '#f3f4f6',
  border:        '#e5e7eb',
  cardBg:        '#ffffff',
  bg:            '#f5f7ff',
  textPrimary:   '#111827',
  textSecondary: '#6b7280',

  // ── Legacy aliases (kept for backward compat — maps to brand colors)
  purple:        '#1a73e8',
  purpleDark:    '#1557b0',
};

// ─── GRADIENTS ──────────────────────────────────────────────────────────────
export const GRADIENTS = {
  primary:   [COLORS.primary,   COLORS.primaryDark],
  teal:      [COLORS.primary,   COLORS.primaryDark],
  secondary: [COLORS.secondary, COLORS.secondaryDark],
  purple:    [COLORS.primary,   COLORS.primaryDark],  // legacy > blue
  accent:    ['#f59e0b',        '#d97706'],
  warning:   ['#f59e0b',        '#d97706'],
  // Deep-navy auth hero — drives every unauthenticated screen.
  authNavy:  ['#0A1B3D', '#0F2C63', '#1a4ba8'],
};

// ─── GLASS (frosted card system, used on the navy auth gradient) ──────────────
// expo-blur isn't installed, so "frost" is a translucent white fill + hairline
// border + soft shadow. Reads as glass against the dark gradient.
export const GLASS = {
  fill:        'rgba(255,255,255,0.10)',
  fillStrong:  'rgba(255,255,255,0.16)',
  border:      'rgba(255,255,255,0.22)',
  borderFocus: 'rgba(255,255,255,0.55)',
  inputFill:   'rgba(255,255,255,0.08)',
  textOnDark:  '#ffffff',
  subOnDark:   'rgba(255,255,255,0.62)',
  faintOnDark: 'rgba(255,255,255,0.38)',
};

// ─── SPACING ────────────────────────────────────────────────────────────────
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// ─── TYPOGRAPHY ─────────────────────────────────────────────────────────────
export const TYPOGRAPHY = {
  heading1: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary },
  heading2: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  heading3: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  subtitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  body:     { fontSize: 14, fontWeight: '400', color: COLORS.textPrimary },
  caption:  { fontSize: 12, fontWeight: '400', color: COLORS.textSecondary },
  label:    { fontSize: 11, fontWeight: '500', color: COLORS.textSecondary },
};

// ─── SHADOWS ────────────────────────────────────────────────────────────────
export const SHADOWS = {
  sm: Platform.select({
    web: { boxShadow: '0px 1px 4px rgba(0,0,0,0.06)' },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
  }),
  md: Platform.select({
    web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
  }),
  lg: Platform.select({
    web: { boxShadow: '0px 4px 16px rgba(0,0,0,0.12)' },
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 5,
    },
  }),
};

// ─── BORDER RADIUS ──────────────────────────────────────────────────────────
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

// ─── CONTINUOUS CURVE (iOS squircle, no-op on Android) ──────────────────────
// Spread into any StyleSheet style that has borderRadius for premium iOS feel.
export const CURVE: any = Platform.OS === 'ios' ? { borderCurve: 'continuous' } : {};

// ─── OVERLAYS ───────────────────────────────────────────────────────────────
// Use these instead of inline rgba() — one place to tune all overlays
export const OVERLAYS = {
  dark:    'rgba(0,0,0,0.5)',
  darker:  'rgba(0,0,0,0.6)',
  darkest: 'rgba(0,0,0,0.75)',
  light:   'rgba(255,255,255,0.75)',
  lighter: 'rgba(255,255,255,0.9)',
  faint:   'rgba(255,255,255,0.15)',
};

// ─── STATUS TOKENS ───────────────────────────────────────────────────────────
// Single source of truth for all ride/booking/request status styling.
// Screens and components must import from here — never hardcode status colors.
export interface StatusToken {
  text: string;
  bg:   string;
  label: string;
}

export const STATUS_COLORS: Record<string, StatusToken> = {
  // Ride statuses
  active:              { text: COLORS.secondary, bg: '#e8f5e9',  label: 'Active' },
  in_progress:         { text: '#0891b2',         bg: '#ecfeff',  label: 'In Progress' },
  completed:           { text: '#0369a1',         bg: '#f0f9ff',  label: 'Completed' },
  cancelled:           { text: COLORS.danger,     bg: '#fef2f2',  label: 'Cancelled' },
  expired:             { text: '#9a3412',         bg: '#fef2f2',  label: 'Expired' },
  expired_no_bookings: { text: '#9a3412',         bg: '#fef2f2',  label: 'Expired, no bookings' },
  // Booking statuses
  confirmed:           { text: COLORS.secondary, bg: '#e8f5e9',  label: 'Confirmed' },
  rejected:            { text: COLORS.danger,     bg: '#fef2f2',  label: 'Rejected' },
  // Request statuses
  open:                { text: COLORS.secondary, bg: '#e8f5e9',  label: 'Open' },
  accepted:            { text: '#0369a1',         bg: '#e0f2fe',  label: 'Accepted' },
  // Misc
  pending:             { text: '#b45309',         bg: '#fffbeb',  label: 'Pending' },
  scheduled:           { text: '#7c3aed',         bg: '#f5f3ff',  label: 'Scheduled' },
  no_requests:         { text: '#64748b',         bg: '#f1f5f9',  label: 'No Requests Yet' },
};

// ─── AMENITY CONFIG ──────────────────────────────────────────────────────────
// Centralizes amenity icon + color for all vehicle amenity displays.
export interface AmenityToken {
  icon:  string;
  color: string;
  label: string;
}

// Keyed by camelCase API field name (e.g. vehicle.ac, vehicle.wifi)
export const AMENITY_CONFIG: Record<string, AmenityToken> = {
  ac:          { icon: 'snow-outline',           color: '#0ea5e9', label: 'A/C' },
  wifi:        { icon: 'wifi-outline',           color: '#6366f1', label: 'WiFi' },
  music:       { icon: 'musical-notes-outline',  color: '#ec4899', label: 'Music' },
  usbCharging: { icon: 'flash-outline',          color: COLORS.warning, label: 'USB' },
  waterCooler: { icon: 'water-outline',          color: '#06b6d4', label: 'Water' },
  blanket:     { icon: 'bed-outline',            color: '#8b5cf6', label: 'Blanket' },
  firstAid:    { icon: 'medkit-outline',         color: '#ef4444', label: 'First Aid' },
  luggageRack: { icon: 'briefcase-outline',      color: '#64748b', label: 'Luggage' },
};

// Legacy string-key variants used in AmenityBadge (display name > token)
export const AMENITY_DISPLAY_CONFIG: Record<string, AmenityToken> = {
  'AC':           { icon: 'snow-outline',           color: '#0ea5e9', label: 'A/C' },
  'WiFi':         { icon: 'wifi-outline',           color: '#6366f1', label: 'WiFi' },
  'Music':        { icon: 'musical-notes-outline',  color: '#ec4899', label: 'Music' },
  'Water Bottle': { icon: 'water-outline',          color: '#06b6d4', label: 'Water Bottle' },
  'Snacks':       { icon: 'fast-food-outline',      color: COLORS.warning, label: 'Snacks' },
  'Blanket':      { icon: 'bed-outline',            color: '#8b5cf6', label: 'Blanket' },
};

// ─── TRUST BADGE CONFIG ──────────────────────────────────────────────────────
// Defines icon, color, and label for each user trust signal.
export interface TrustToken {
  label: string;
  icon:  string;
  color: string;
  bg:    string;
}

export const TRUST_BADGE_CONFIG: Record<string, TrustToken> = {
  phone:   { label: 'Phone Verified', icon: 'call',             color: '#00897b', bg: '#e0f7fa' },
  cnic:    { label: 'CNIC Verified',  icon: 'card',             color: '#43a047', bg: '#e8f5e9' },
  licence: { label: 'Licensed',       icon: 'car-sport',        color: COLORS.primary, bg: '#eff6ff' },
  top:     { label: 'Top Rated',      icon: 'star',             color: '#f9a825', bg: '#fff8e1' },
  trusted: { label: 'Trusted',        icon: 'shield-checkmark', color: COLORS.primary, bg: '#eff6ff' },
};
