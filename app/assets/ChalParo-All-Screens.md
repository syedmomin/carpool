# ChalParo — Complete Screen Inventory

**34 screen files total**, every one registered in `src/navigation/AppNavigator.tsx` (no orphan/unused screens).

| Folder | Count |
|---|---|
| `screens/auth/` | 5 |
| `screens/common/` | 11 |
| `screens/driver/` | 10 |
| `screens/passenger/` | 8 |
| **Total** | **34** |

Navigation is role-based: **5 tabs for driver, 5 tabs for passenger**, each tab its own native stack.

---

## 1. AUTH — before login (both roles)

| # | Route name | File |
|---|---|---|
| 1 | *(no route — conditional render)* | `auth/SplashScreen.tsx` |
| 2 | `Login` | `auth/LoginScreen.tsx` |
| 3 | `RoleSelect` | `auth/RoleSelectScreen.tsx` |
| 4 | `Register` | `auth/RegisterScreen.tsx` |
| 5 | `ForgotPassword` | `auth/ForgotPasswordScreen.tsx` |

Splash is rendered directly while `isLoading` is true (AppNavigator.tsx:502), not as a `Stack.Screen`.

---

## 2. ROOT — above the tabs, reachable by BOTH roles

| Route name | File | Note |
|---|---|---|
| `RideTracking` | `driver/RideTrackingScreen.tsx` | **Lives in `driver/` but used by BOTH roles** — same screen serves driver and passenger live tracking |
| `Chat` | `common/ChatScreen.tsx` | Opened from either side of a booking |

---

## 3. DRIVER — 5 tabs

### Tab 1 — Dashboard (`DriverHomeTab`)
Stack: `DriverDashboardStack`

| Route | File |
|---|---|
| `DriverHome` | `driver/DriverHomeScreen.tsx` |
| `PostRide` | `driver/PostRideScreen.tsx` |
| `MyRides` | `driver/ActiveRidesScreen.tsx` |
| `RideBookings` | `driver/RideBookingsScreen.tsx` |
| `RideHistory` | `driver/RideHistoryScreen.tsx` |
| `MyVehicles` | `driver/MyVehiclesScreen.tsx` |
| `Notifications` | `common/NotificationsScreen.tsx` |
| `Earnings` | `driver/EarningsScreen.tsx` |
| `VehicleSetup` | `driver/VehicleSetupScreen.tsx` |
| `OpenRequests` | `driver/OpenRequestsScreen.tsx` |

### Tab 2 — Requests (`DriverRequestsTab`)
Stack: `DriverOpenRequestsStack`

| Route | File |
|---|---|
| `OpenRequestsMain` | `driver/OpenRequestsScreen.tsx` |

### Tab 3 — My Rides (`MyRidesTab`)
Stack: `DriverRidesStack`

| Route | File |
|---|---|
| `ActiveRides` | `driver/ActiveRidesScreen.tsx` |
| `MyRides` | `driver/ActiveRidesScreen.tsx` *(same component, 2nd alias)* |
| `PostRide` | `driver/PostRideScreen.tsx` |
| `RideBookings` | `driver/RideBookingsScreen.tsx` |
| `RideHistory` | `driver/RideHistoryScreen.tsx` |
| `VehicleSetup` | `driver/VehicleSetupScreen.tsx` |

### Tab 4 — Vehicles (`MyVehiclesTab`)
Stack: `DriverVehiclesStack`

| Route | File |
|---|---|
| `MyVehicles` | `driver/MyVehiclesScreen.tsx` |
| `VehicleSetup` | `driver/VehicleSetupScreen.tsx` |

### Tab 5 — Profile (`DriverProfileTab`)
Stack: `CommonProfileStack` — **shared with passenger**, see section 5.

---

## 4. PASSENGER — 5 tabs

### Tab 1 — Home (`PassengerHomeTab`)
Stack: `PassengerRidesStack`

| Route | File |
|---|---|
| `PassengerHomeMain` | `passenger/HomeScreen.tsx` |
| `Notifications` | `common/NotificationsScreen.tsx` |
| `Search` | `passenger/SearchScreen.tsx` |
| `RideDetail` | `passenger/RideDetailScreen.tsx` |
| `BookingConfirm` | `passenger/BookingConfirmScreen.tsx` |

### Tab 2 — Search (`SearchTab`)
Stack: `PassengerSearchStack`

| Route | File |
|---|---|
| `SearchMain` | `passenger/SearchScreen.tsx` |
| `Notifications` | `common/NotificationsScreen.tsx` |
| `RideDetail` | `passenger/RideDetailScreen.tsx` |
| `BookingConfirm` | `passenger/BookingConfirmScreen.tsx` |

### Tab 3 — Requests (`RequestsTab`)
Stack: `PassengerRequestsStack`

| Route | File |
|---|---|
| `MyRequests` | `passenger/MyRequestsScreen.tsx` |
| `PostRequest` | `passenger/PostRequestScreen.tsx` |
| `BookingConfirm` | `passenger/BookingConfirmScreen.tsx` |

### Tab 4 — Bookings (`BookingHistoryTab`)
Stack: `PassengerBookingsStack`

| Route | File |
|---|---|
| `BookingHistoryMain` | `passenger/BookingHistoryScreen.tsx` |
| `PastBookings` | `passenger/PastBookingsScreen.tsx` |
| `RideDetail` | `passenger/RideDetailScreen.tsx` |

### Tab 5 — Profile (`PassengerProfileTab`)
Stack: `CommonProfileStack` — **shared with driver**, see section 5.

---

## 5. COMMON PROFILE STACK — identical for BOTH roles

Both `DriverProfileTab` and `PassengerProfileTab` mount the exact same `CommonProfileStack`:

| Route | File |
|---|---|
| `ProfileMain` | `common/ProfileScreen.tsx` |
| `EditProfile` | `common/EditProfileScreen.tsx` |
| `CnicVerify` | `common/CnicVerificationScreen.tsx` |
| `ChangePassword` | `common/ChangePasswordScreen.tsx` |
| `Reviews` | `common/ReviewsScreen.tsx` |
| `Support` | `common/SupportScreen.tsx` |
| `Terms` | `common/TermsScreen.tsx` |
| `Privacy` | `common/PrivacyScreen.tsx` |
| `About` | `common/AboutScreen.tsx` |
| `RideDetail` | `passenger/RideDetailScreen.tsx` |
| `RideHistory` | `driver/RideHistoryScreen.tsx` |
| `PastBookings` | `passenger/PastBookingsScreen.tsx` |
| `BookingHistory` | `passenger/BookingHistoryScreen.tsx` |

### ⚠️ Cross-role leakage in this stack
Because the profile stack is shared verbatim, **each role can navigate to the other role's screens**:

- A **DRIVER** can reach `BookingHistory`, `PastBookings`, and `RideDetail` — all passenger screens.
- A **PASSENGER** can reach `RideHistory` — a driver screen.

These are registered routes, so they're reachable by any `navigate()` call or deep link, not just by visible buttons. Worth checking whether each of those screens guards against being opened by the wrong role, or whether the stack should be split per role.

---

## 6. Screens by file — master checklist

### `screens/auth/` (5)
1. `ForgotPasswordScreen.tsx`
2. `LoginScreen.tsx`
3. `RegisterScreen.tsx`
4. `RoleSelectScreen.tsx`
5. `SplashScreen.tsx`

### `screens/common/` (11)
6. `AboutScreen.tsx`
7. `ChangePasswordScreen.tsx`
8. `ChatScreen.tsx`
9. `CnicVerificationScreen.tsx`
10. `EditProfileScreen.tsx`
11. `NotificationsScreen.tsx`
12. `PrivacyScreen.tsx`
13. `ProfileScreen.tsx`
14. `ReviewsScreen.tsx`
15. `SupportScreen.tsx`
16. `TermsScreen.tsx`

### `screens/driver/` (10)
17. `ActiveRidesScreen.tsx`
18. `DriverHomeScreen.tsx`
19. `EarningsScreen.tsx`
20. `MyVehiclesScreen.tsx`
21. `OpenRequestsScreen.tsx`
22. `PostRideScreen.tsx`
23. `RideBookingsScreen.tsx`
24. `RideHistoryScreen.tsx`
25. `RideTrackingScreen.tsx` ← *used by both roles*
26. `VehicleSetupScreen.tsx`

### `screens/passenger/` (8)
27. `BookingConfirmScreen.tsx`
28. `BookingHistoryScreen.tsx`
29. `HomeScreen.tsx` *(exported as `PassengerHomeScreen`)*
30. `MyRequestsScreen.tsx`
31. `PastBookingsScreen.tsx`
32. `PostRequestScreen.tsx`
33. `RideDetailScreen.tsx`
34. `SearchScreen.tsx`

---

## 7. Notes worth acting on

1. **`RideTrackingScreen.tsx` sits in `screens/driver/`** but serves both roles. Misleading location — consider moving to `common/`.
2. **`HomeScreen.tsx`** is the only screen whose filename doesn't match its exported component (`PassengerHomeScreen`). Consider renaming for consistency.
3. **Duplicate route aliases**: `ActiveRidesScreen` is registered as both `ActiveRides` and `MyRides` in the same stack; `MyRides` also exists in the Dashboard stack. Three routes, one component — easy source of navigation confusion.
4. **`VehicleSetup` is registered in 3 stacks**, `RideDetail` in 4, `BookingConfirm` in 3, `Notifications` in 3. Intentional for deep-linking within each tab, but means "go back" behaviour differs by entry point.
5. **Cross-role route exposure** in the shared profile stack (see section 5).
