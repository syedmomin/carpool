// ─── COLORS ────────────────────────────────────────────────────────────────
export const COLORS = {
  primary: '#1a73e8',
  primaryDark: '#0d47a1',
  secondary: '#34a853',
  secondaryDark: '#2e7d32',
  accent: '#fbbc04',
  danger: '#ea4335',
  dangerLight: '#ffebee',
  warning: '#ff9800',
  warningLight: '#fff3e0',
  white: '#ffffff',
  black: '#1a1a2e',
  gray: '#6b7280',
  lightGray: '#f3f4f6',
  border: '#e5e7eb',
  cardBg: '#ffffff',
  bg: '#f8f9ff',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  teal: '#00897b',
  tealDark: '#00695c',
  purple: '#7c3aed',
  purpleDark: '#5b21b6',
};

// ─── GRADIENTS ──────────────────────────────────────────────────────────────
export const GRADIENTS = {
  primary:   [COLORS.primary,   COLORS.primaryDark],
  secondary: [COLORS.secondary, COLORS.secondaryDark],
  teal:      [COLORS.teal,      COLORS.tealDark],
  purple:    [COLORS.purple,    COLORS.purpleDark],
  accent:    ['#fbbc04',        '#f57f17'],
  warning:   [COLORS.warning,   '#e65100'],
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
  body: { fontSize: 14, fontWeight: '400', color: COLORS.textPrimary },
  caption: { fontSize: 12, fontWeight: '400', color: COLORS.textSecondary },
  label: { fontSize: 11, fontWeight: '500', color: COLORS.textSecondary },
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
