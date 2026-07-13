// ─── Theme ───────────────────────────────────────────────────────────────────
export {
  COLORS, GRADIENTS, GLASS, SPACING, TYPOGRAPHY, SHADOWS, RADIUS, CURVE,
  OVERLAYS, STATUS_COLORS, AMENITY_CONFIG, AMENITY_DISPLAY_CONFIG, TRUST_BADGE_CONFIG,
} from './theme';
export type { StatusToken, AmenityToken, TrustToken } from './theme';

// ─── Buttons ─────────────────────────────────────────────────────────────────
export { PrimaryButton, GhostButton, IconButton, FAB } from './Button';

// ─── Badges ──────────────────────────────────────────────────────────────────
export { AmenityBadge, StatusBadge, NotifBadge, RoleBadge, VerifiedBadge, TrustBadgesRow, computeBadges } from './Badge';

// ─── Inputs ──────────────────────────────────────────────────────────────────
export { FormInput, SearchInput, OTPInput } from './Input';

// ─── Cards ───────────────────────────────────────────────────────────────────
export { RideCard, StatsCard, MenuCard, InfoItem } from './Card';
export { PressableScale } from './PressableScale';
export { AnimatedNumber } from './AnimatedNumber';
export { PulseBadge } from './PulseBadge';

// ─── Headers ─────────────────────────────────────────────────────────────────
export { GradientHeader } from './Header';

// ─── Avatar ──────────────────────────────────────────────────────────────────
export { Avatar } from './Avatar';

// ─── Chips / Tabs ────────────────────────────────────────────────────────────
export { Chip, ChipGroup, TabPills } from './Chip';

// ─── Star Rating ─────────────────────────────────────────────────────────────
export { StarRating } from './StarRating';

// ─── Section Header ──────────────────────────────────────────────────────────
export { SectionHeader } from './SectionHeader';

// ─── Empty State ─────────────────────────────────────────────────────────────
export { EmptyState } from './EmptyState';

// ─── Progress Bar ────────────────────────────────────────────────────────────
export { ProgressBar } from './ProgressBar';

// ─── Divider ─────────────────────────────────────────────────────────────────
export { Divider, DividerText } from './Divider';


// ─── Date / Time Pickers ─────────────────────────────────────────────────────
export { DatePickerInput, TimePickerInput } from './DateTimePicker';

// ─── Toast ────────────────────────────────────────────────────────────────────
export { default as Toast } from './Toast';

// ─── City Search Modal (shared) ───────────────────────────────────────────────
export { default as CitySearchModal } from './CitySearchModal';

// ─── Auth background + inputs (navy gradient hero system) ──────────────────────
export { default as AuthBackground } from './AuthBackground';
export { default as AuthInput } from './AuthInput';

// ─── Logo (centralized, variant-based) ────────────────────────────────────────
export { default as Logo } from './Logo';
export type { LogoVariant } from './Logo';

// ─── Route Loader (animated curved path) ──────────────────────────────────────
export { default as RouteLoader } from './RouteLoader';

// ─── Route Tag (from > to with SVG arrow) ─────────────────────────────────────
export { RouteTag } from './RouteTag';

// ─── Skeletons ────────────────────────────────────────────────────────────────
export {
  Skeleton,
  CardSkeleton,
  RideCardSkeleton,
  BookingCardSkeleton,
  RequestCardSkeleton,
} from './Skeleton';
