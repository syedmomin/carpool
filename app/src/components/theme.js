// ─── SafariShare Brand Palette ───────────────────────────────────────────────
// Rule: passenger UI = primary blue | driver UI = teal
// Never use purple — was replaced with blue
export const COLORS = {
  // ── Core brand
  primary:       '#1a73e8',   // passenger CTA, general links
  primaryDark:   '#1557b0',
  primaryLight:  '#e8f0fe',

  // ── Driver accent
  teal:          '#0097a7',
  tealDark:      '#006978',
  tealLight:     '#e0f7fa',

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
  teal:      [COLORS.teal,      COLORS.tealDark],
  secondary: [COLORS.secondary, COLORS.secondaryDark],
  purple:    [COLORS.primary,   COLORS.primaryDark],  // legacy → blue
  accent:    ['#f59e0b',        '#d97706'],
  warning:   ['#f59e0b',        '#d97706'],
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
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
};

// ─── BORDER RADIUS ──────────────────────────────────────────────────────────
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};
