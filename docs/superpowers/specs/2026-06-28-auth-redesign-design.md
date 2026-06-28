# ChalParo Auth Flow Redesign — Design Spec

Date: 2026-06-28

## Goal
Redesign the authentication flow (Splash, Role Selection, Login, Register) into a
modern, cohesive design system derived from the provided splash/login reference.
Replace the existing screens completely. "History" means restyling all existing
auth screens to the new system — no git rewriting.

## Source analysis (reference image)
- **Palette:** navy gradient `#0A1B3D → #0F2C63 → #1a4ba8`; brand blue `#1a73e8`,
  blue-dark `#1557b0`; success green `#2e7d32`; white text with
  `rgba(255,255,255,0.6–0.85)` secondaries. Light screens: `#fff` body,
  `#1a1a1a` titles, `#666` subtitles, `#e0e0e0` borders.
- **Typography:** bold wordmark; 17px/700 tagline; 13px/700 feature titles;
  11px muted subtitles; 20px/bold screen titles; 14px body.
- **Assets/icons:** heart+road logo mark, Ionicons in colored circles, city
  skyline silhouette, location pins, curved route line.
- **Shadows:** soft elevation on the white logo badge and cards.

## Design system additions (`components/theme.tsx`)
- `GRADIENTS.authNavy = ['#0A1B3D', '#0F2C63', '#1a4ba8']`.
- Inputs standardize: 50px height, `RADIUS.md` (12), focus state (border →
  primary + faint blue ring). Reuse existing COLORS/SHADOWS/RADIUS tokens.

## Components
- **`AuthFeatureRow`** (new, `components/`): renders N columns of
  `{ icon, iconBg, title, subtitle }` with optional dividers. Two visual modes:
  `dark` (splash, divider lines, white text) and `card` (login, white cards).
  Shared by Splash and Login so the trust signals have one implementation.

## Screens
### SplashScreen (visual-only; logic untouched)
Replace night-car `ImageBackground` with `LinearGradient(authNavy)` plus a subtle
SVG skyline/route decoration. Keep logo, tagline, "Pakistan's Trusted Carpooling
Platform", `RouteLoader`, the 3 feature columns (via `AuthFeatureRow` dark mode),
"Made in Pakistan". Preserve all readiness logic: `systemApi.health` poll,
`MIN_SPLASH_MS`, `backendReady/minElapsed/isLoading` gating, `onDone()`.

### RoleSelectScreen (new — first unauthenticated route)
`AuthHeader` curved top + two large selectable role cards:
- Passenger — person icon, "Find affordable rides".
- Driver — car-sport icon, "Offer rides & earn".
Selected card highlights (blue border/fill accent). A **Continue** button routes
to `Login` with `{ intendedRole }`. Footer link "New here? Create an account" →
`Register` with `{ intendedRole }`.

### LoginScreen
Keep `AuthHeader` + "Welcome Back!". Restyle inputs to the new system (focus
states, radius 12). Add the 3 bottom feature cards (Safe & Secure / Ride Together
/ Eco-Friendly) via `AuthFeatureRow` card mode. "Create New Account" forwards
`intendedRole` to Register. Login role still resolves server-side; param only
pre-fills Register and themes context.

### RegisterScreen
Keep `AuthHeader` + form. Replace role buttons with a restyled **segmented
toggle** pre-set from `route.params.intendedRole` (still switchable). Apply new
input system. "Sign In Instead" forwards role to Login.

## Navigation (`navigation/AppNavigator.tsx`)
Unauthenticated stack becomes: `RoleSelect` (initial) → `Login` ⇄ `Register`.
Param shape: `{ intendedRole?: 'passenger' | 'driver' }` (optional everywhere).

## Out of scope
Auth API/login logic, validation rules, protected-app screens, git history.

## Success criteria
- All four auth screens render in the unified design system.
- Role selection sets `intendedRole` carried through Login/Register.
- Splash readiness/navigation behavior unchanged.
- `tsc` passes; no new lint/type errors.
