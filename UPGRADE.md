# ChalParo — Advanced Feature Upgrade Plan

> Deep implementation reference for all planned features.  
> Stack: Expo SDK 54 · React Native 0.81 · Express 5 · Prisma 7 · PostgreSQL · Socket.IO · Redis · Fly.io

---

## Table of Contents

1. [In-App Payments — JazzCash / EasyPaisa / Card](#feature-1--in-app-payments)
2. [Women-Safety Mode](#feature-2--women-safety-mode)
3. [Recurring / Template Rides](#feature-3--recurring--template-rides)
4. [Dynamic Pricing Suggestions](#feature-4--dynamic-pricing-suggestions)
5. [CNIC / ID Verification](#feature-5--cnic--id-verification)
6. [Intercity / Long-Haul Rides](#feature-6--intercity--long-haul-rides)
7. [Driver Analytics Dashboard](#feature-7--driver-analytics-dashboard)
8. [Referral & Ride Credits](#feature-8--referral--ride-credits)
9. [Build Order & Dependencies](#build-order--dependencies)

---

## Feature 1 — In-App Payments

### Goal
Replace cash-on-delivery with a trust-enforced escrow: passenger pays at booking, driver receives after ride completes, refunds are automatic on cancellation.

### Payment Gateway
**JazzCash** (primary — largest mobile wallet in Pakistan, ~50 M users) via their REST Merchant API.  
**EasyPaisa** (secondary).  
**Stripe** for debit/credit cards (Pakistan support launched 2024 — requires Stripe Atlas or local entity).

---

### Database Schema

```prisma
model Wallet {
  id          String        @id @default(cuid())
  userId      String        @unique
  user        User          @relation(fields: [userId], references: [id])
  balance     Int           @default(0)       // stored in paisas (PKR x 100)
  currency    String        @default("PKR")
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  transactions Transaction[]
  withdrawals Withdrawal[]
}

model Transaction {
  id          String            @id @default(cuid())
  walletId    String
  wallet      Wallet            @relation(fields: [walletId], references: [id])
  type        TransactionType
  amount      Int               // paisas, always positive
  bookingId   String?
  booking     Booking?          @relation(fields: [bookingId], references: [id])
  status      TransactionStatus @default(PENDING)
  gatewayRef  String?           // JazzCash/EasyPaisa transaction ID
  meta        Json?             // raw gateway response snapshot
  createdAt   DateTime          @default(now())
}

model Withdrawal {
  id            String            @id @default(cuid())
  walletId      String
  wallet        Wallet            @relation(fields: [walletId], references: [id])
  amount        Int               // paisas
  method        WithdrawalMethod
  accountNumber String
  status        WithdrawalStatus  @default(PENDING)
  processedAt   DateTime?
  createdAt     DateTime          @default(now())
}

enum TransactionType   { HOLD RELEASE REFUND CREDIT WITHDRAWAL }
enum TransactionStatus { PENDING COMPLETED FAILED REVERSED }
enum WithdrawalMethod  { JAZZCASH EASYPAISA BANK_TRANSFER }
enum WithdrawalStatus  { PENDING PROCESSING COMPLETED FAILED }
```

**Booking model additions:**
```prisma
paymentStatus  PaymentStatus  @default(UNPAID)
paymentMethod  PaymentMethod?
gatewayOrderId String?

enum PaymentStatus { UNPAID HELD RELEASED REFUNDED }
enum PaymentMethod { JAZZCASH EASYPAISA CARD WALLET }
```

---

### Backend — New Routes

```
POST   /payments/initiate       Initiate payment for a booking
POST   /payments/webhook        JazzCash/EasyPaisa callback (public, HMAC-verified)
GET    /wallet                  Get own wallet balance + recent transactions
POST   /wallet/withdraw         Request withdrawal
GET    /wallet/transactions     Paginated transaction history
GET    /admin/withdrawals       Admin: list pending withdrawals
PATCH  /admin/withdrawals/:id   Admin: mark processed / failed
```

**`POST /payments/initiate` request / response:**
```typescript
// Request
{ bookingId: string, method: 'JAZZCASH' | 'EASYPAISA' | 'CARD' | 'WALLET' }

// Response
{
  redirectUrl?: string,    // for JazzCash redirect flow
  deepLink?: string,       // for EasyPaisa app deeplink
  clientSecret?: string,   // for Stripe card
  orderId: string          // stored on Booking.gatewayOrderId
}
```

**Payment service flow:**
1. Validate booking belongs to requesting passenger, status = PENDING.
2. Calculate amount: `booking.seats x ride.pricePerSeat`.
3. If method = WALLET: check `passenger.wallet.balance >= amount`, deduct immediately as HOLD transaction.
4. If method = JAZZCASH: call JazzCash `/JazzCashInitiate` with HMAC-signed payload, return redirect URL.
5. Store `gatewayOrderId` on booking, set `paymentStatus = UNPAID` (awaiting webhook confirmation).

**`POST /payments/webhook` — idempotent handler:**
```typescript
// 1. Verify HMAC: SHA256(secretKey + pp_Amount + pp_TxnRefNo + pp_ResponseCode)
// 2. On ResponseCode "000" (success):
//    - Create HOLD Transaction row
//    - Set booking.paymentStatus = HELD
//    - Proceed to notify driver (same as current booking request flow)
// 3. On failure: log and return HTTP 200 (gateway requirement — never return 4xx to webhook)
// 4. Idempotency: unique constraint on gatewayOrderId prevents double-processing
```

**Ride completion hook additions in `ride.service.updateStatus`:**
```typescript
// When status transitions to COMPLETED:
for (const booking of confirmedBookings) {
  await releaseEscrow(booking.id);  // HOLD -> RELEASE on passenger wallet
  await creditDriver(booking.id);   // credit driver wallet balance
}

// When driver cancels:
for (const booking of pendingOrConfirmedBookings) {
  await refundEscrow(booking.id);   // HOLD -> REFUND to passenger
}
```

---

### Frontend — New Screens

**`PaymentScreen`** (`app/src/screens/passenger/PaymentScreen.tsx`):
- Triggered after driver accepts booking.
- Shows booking summary: route, seats, total amount in PKR.
- Payment method selector: JazzCash / EasyPaisa / Card / Wallet balance.
- "Pay Rs X" CTA calls `/payments/initiate`, then opens a WebView or deeplink.
- Success/failure handling via deep-link return URL `chalparo://payment/result?status=success`.

**`WalletScreen`** (`app/src/screens/driver/WalletScreen.tsx`):
- Header: available balance in large text.
- Withdraw button opens a bottom sheet: amount input + method selector + account number.
- FlatList of transactions: type icon, description, amount (green = credit, red = debit), date.

**Booking card update:**
- `PaymentBadge`: "Paid" (green), "Pending Payment" (amber), "Cash" (gray).

---

### Security Checklist
- Webhook verifies HMAC before any DB write.
- Withdrawal only to accounts verified against user identity (Feature 5 dependency).
- Amount stored in paisas (integer arithmetic only — no floats).
- `gatewayOrderId` unique constraint prevents double-processing of the same webhook.

---

## Feature 2 — Women-Safety Mode

### Goal
Allow drivers to restrict rides to female passengers only. Enforced server-side, not just in UI.

---

### Database Schema

```prisma
// User model additions:
gender        Gender?
genderPolicy  GenderPolicy?   // driver's default preference

// Ride model addition:
genderPolicy  GenderPolicy    @default(MIXED)

enum Gender       { MALE FEMALE OTHER PREFER_NOT_TO_SAY }
enum GenderPolicy { MIXED WOMEN_ONLY }
```

---

### Backend Changes

**`POST /rides` (create ride):**
- Accept `genderPolicy` in body. Defaults to `MIXED`.

**`POST /bookings` (request booking) — new guard:**
```typescript
if (ride.genderPolicy === 'WOMEN_ONLY') {
  if (!passenger.gender) {
    throw ApiError(400, 'Please set your gender in profile to book this ride.');
  }
  if (passenger.gender !== 'FEMALE') {
    throw ApiError(403, 'This ride is for female passengers only.');
  }
}
```

**`GET /rides/search`:**
- New query param `?womenOnly=true` adds `WHERE genderPolicy = 'WOMEN_ONLY'`.

**`PATCH /profile`:**
- Accept `gender` field. Once set via CNIC verification (Feature 5), gender is locked to CNIC data.

---

### Frontend Changes

**Onboarding** — gender selection step after name/phone:
- Options: Male / Female / Prefer not to say.
- Copy: "This helps us match you with the right rides. It is never shown publicly."

**`PostRideScreen`** — new "Who can ride with you?" section:
```
( ) Everyone welcome
(*) Women only  [shield icon]
    "Only female passengers will be able to book this ride."
```

**`SearchScreen`** — filter chip:
- "Women Only" chip with shield icon. Appends `womenOnly=true` to search query.

**`RideCard`** — badge:
- Purple shield icon for `genderPolicy === 'WOMEN_ONLY'` rides.
- Shown in search results, booking history, and active rides list.

**`ProfileScreen`** — gender prompt:
- If gender not set and user tries to book a women-only ride: "Set your gender in profile to continue."

---

### UX Rules
- Gender is never surfaced to other users — used only for server-side filtering.
- `PREFER_NOT_TO_SAY` cannot book women-only rides (enforced server-side).
- Female driver on a MIXED ride shows a subtle "Female Driver" indicator (derived from CNIC verification).

---

## Feature 3 — Recurring / Template Rides

### Goal
Let drivers define one template; concrete rides materialize daily via cron. Passengers subscribe once and get auto-booked on each occurrence.

---

### Database Schema

```prisma
model RideTemplate {
  id            String         @id @default(cuid())
  driverId      String
  driver        User           @relation(fields: [driverId], references: [id])
  vehicleId     String?
  vehicle       Vehicle?       @relation(fields: [vehicleId], references: [id])
  fromCity      String
  toCity        String
  stops         Json           // RideStop[]
  departureTime String         // "HH:MM" 24-hour
  pricePerSeat  Int
  totalSeats    Int
  genderPolicy  GenderPolicy   @default(MIXED)
  recurrence    Recurrence
  activeDays    Int[]          // ISO weekday numbers: [1,2,3,4,5] = Mon-Fri
  active        Boolean        @default(true)
  createdAt     DateTime       @default(now())
  rides         Ride[]
  subscriptions TemplateSubscription[]
}

model TemplateSubscription {
  id          String       @id @default(cuid())
  templateId  String
  template    RideTemplate @relation(fields: [templateId], references: [id])
  passengerId String
  passenger   User         @relation(fields: [passengerId], references: [id])
  seats       Int          @default(1)
  active      Boolean      @default(true)
  createdAt   DateTime     @default(now())

  @@unique([templateId, passengerId])
}

// Ride model addition:
templateId  String?
template    RideTemplate? @relation(fields: [templateId], references: [id])

enum Recurrence { DAILY WEEKDAYS WEEKENDS CUSTOM }
```

---

### Backend — Cron Job `src/jobs/materializeTemplates.ts`

```typescript
// Cron schedule: 0 5 * * *  (5 AM daily, before commuters wake)
// On Fly.io: deploy as a separate cron machine or use Fly Machines scheduled run

export async function materializeForDate(targetDate: Date) {
  const dayOfWeek = getISODay(targetDate); // 1 = Monday ... 7 = Sunday
  const templates = await prisma.rideTemplate.findMany({
    where:   { active: true, activeDays: { has: dayOfWeek } },
    include: { subscriptions: { where: { active: true } } },
  });

  for (const template of templates) {
    const dateStr = format(targetDate, 'yyyy-MM-dd');

    // Skip if this date is already materialized
    const existing = await prisma.ride.findFirst({
      where: { templateId: template.id, date: dateStr },
    });
    if (existing) continue;

    const ride = await prisma.ride.create({
      data: {
        driverId:    template.driverId,
        vehicleId:   template.vehicleId,
        fromCity:    template.fromCity,
        toCity:      template.toCity,
        stops:       template.stops,
        date:        dateStr,
        time:        template.departureTime,
        pricePerSeat: template.pricePerSeat,
        totalSeats:  template.totalSeats,
        genderPolicy: template.genderPolicy,
        templateId:  template.id,
        status:      'ACTIVE',
      },
    });

    // Auto-book active subscribers (no driver approval required)
    for (const sub of template.subscriptions) {
      await bookingService.create({
        passengerId: sub.passengerId,
        rideId:      ride.id,
        seats:       sub.seats,
        autoAccept:  true,
      });
    }

    // Notify driver
    await notificationDispatcher.send(template.driverId, {
      title: 'Ride created for today',
      body:  `Your ${template.fromCity} to ${template.toCity} ride is live.`,
      type:  'TEMPLATE_RIDE_CREATED',
      data:  { rideId: ride.id },
    });
  }
}
```

**New routes:**
```
POST   /templates                   Create ride template
GET    /templates/mine              Driver: list own templates
PATCH  /templates/:id               Update (affects future rides only)
DELETE /templates/:id               Deactivate
POST   /templates/:id/subscribe     Passenger subscribes
DELETE /templates/:id/subscribe     Passenger unsubscribes
```

---

### Frontend Changes

**`CreateTemplateScreen`** (`app/src/screens/driver/CreateTemplateScreen.tsx`):
- Adapts PostRideScreen with:
  - Recurrence picker: Daily / Weekdays / Weekends / Custom.
  - Day checkbox grid (Mon–Sun) for Custom recurrence.
  - Departure time only (no date).
- Preview text: "This will create rides every Mon, Tue, Wed, Thu, Fri at 8:00 AM."

**`MyTemplatesScreen`** (`app/src/screens/driver/MyTemplatesScreen.tsx`):
- Card per template: route summary, departure time, recurrence label, subscriber count.
- Pause / Resume toggle. Edit and Delete actions.
- "Next ride: tomorrow, 8:00 AM" label.

**`RideCard`** update:
- "Daily" or "Weekdays" badge on template-sourced rides.
- "Subscribe" button replaces "Book" for passengers browsing a template ride.

**`SubscribeModal`:**
- "Subscribe to this route" bottom sheet.
- Seat count selector (1–4).
- Confirm: "You will be auto-booked every time this ride runs. You can cancel any time."

---

## Feature 4 — Dynamic Pricing Suggestions

### Goal
Show a data-driven price suggestion when the driver posts a ride. Reduce underpricing and highlight demand.

---

### Pricing Formula

```
suggestedPrice = (distanceKm x PKR_PER_KM x fuelMultiplier / avgCarpool)
                 x demandMultiplier
                 x timeOfDayMultiplier

PKR_PER_KM          = 8.5  (updated monthly in PriceConfig)
avgCarpool          = 3    (assumed fill rate)
demandMultiplier    = 1.0 | 1.2 | 1.4  (low / medium / high based on Redis search count)
timeOfDayMultiplier = 1.2 during 07:00-09:00 and 17:00-20:00, else 1.0

range.min = suggestedPrice x 0.80
range.max = suggestedPrice x 1.30
All values rounded to nearest Rs 10.
```

**Distance source**: OSRM public API (`router.project-osrm.org`) — free, OpenStreetMap-based.  
Fallback: Haversine straight-line x 1.3 road-factor coefficient.

---

### Database Schema

```prisma
model PriceConfig {
  id             String   @id @default(cuid())
  fromCity       String
  toCity         String
  distanceKm     Float
  pkrPerKm       Float    @default(8.5)
  rushMultiplier Float    @default(1.2)
  updatedAt      DateTime @updatedAt

  @@unique([fromCity, toCity])
}
```

---

### Backend — `GET /rides/price-suggestion?from=&to=&time=`

```typescript
async function priceSuggestion(from: string, to: string, time: string) {
  // 1. Distance from cache or OSRM
  let config = await prisma.priceConfig.findUnique({
    where: { fromCity_toCity: { fromCity: from, toCity: to } },
  });
  if (!config) {
    const km = await osrmDistance(from, to);
    config = await prisma.priceConfig.create({
      data: { fromCity: from, toCity: to, distanceKm: km },
    });
  }

  // 2. Demand signal (Redis counter incremented on every search for this pair)
  const count = parseInt(await redis.get(`search_count:${from}:${to}`) ?? '0');
  const demandMultiplier = count > 50 ? 1.4 : count > 20 ? 1.2 : 1.0;
  const demandLevel      = count > 50 ? 'HIGH' : count > 20 ? 'MEDIUM' : 'LOW';

  // 3. Rush hour check
  const hour = parseInt(time.split(':')[0]);
  const rush = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 20);
  const timeMultiplier = rush ? config.rushMultiplier : 1.0;

  // 4. Compute and round to nearest Rs 10
  const round10 = (n: number) => Math.round(n / 10) * 10;
  const base      = (config.distanceKm * config.pkrPerKm) / 3;
  const suggested = round10(base * demandMultiplier * timeMultiplier);

  return {
    suggested,
    min:         round10(suggested * 0.8),
    max:         round10(suggested * 1.3),
    demandLevel,
    distanceKm:  config.distanceKm,
    rushHour:    rush,
  };
}
```

**Search increment in `rides.controller.search`:**
```typescript
await redis.incr(`search_count:${from}:${to}`);
await redis.expire(`search_count:${from}:${to}`, 1800); // 30-min TTL
```

---

### Frontend — `PriceSuggestionSlider` Component

```tsx
// app/src/components/PriceSuggestionSlider.tsx
// Props: { from, to, time, value, onChange }
// - Fetches /rides/price-suggestion when from+to+time are set
// - Renders a range track: min ←[thumb]→ max
// - Thumb snaps to nearest Rs 10
// - "Suggested" marker on the track
// - Demand banner: "High demand right now 🔥 — your ride may fill faster"
// - Footer: "Based on {distanceKm} km route · current fuel rates · demand signal"
// - "Use Suggested Price" link resets thumb to suggested
```

Replaces the static price TextInput in `PostRideScreen`.

---

## Feature 5 — CNIC / ID Verification

### Goal
Pakistan-specific identity trust layer. Phase 1 ships in one week (manual admin review). Phase 2 adds automated NADRA Verisys match.

---

### Database Schema

```prisma
model VerificationRequest {
  id              String             @id @default(cuid())
  userId          String
  user            User               @relation(fields: [userId], references: [id])
  cnicNumber      String
  cnicFrontUrl    String
  cnicBackUrl     String
  selfieUrl       String
  status          VerificationStatus @default(PENDING)
  rejectionReason String?
  reviewedBy      String?
  reviewedAt      DateTime?
  createdAt       DateTime           @default(now())
}

// User model additions:
isVerified       Boolean            @default(false)
cnicNumber       String?            @unique
gender           Gender?            // auto-derived from CNIC on approval

enum VerificationStatus { PENDING APPROVED REJECTED }
```

---

### Backend Routes

```
POST   /profile/verify              Submit CNIC + selfie documents
GET    /profile/verify/status       Check own verification status
GET    /admin/verifications         List PENDING verifications (admin role)
PATCH  /admin/verifications/:id     Approve or reject with optional reason
```

**`POST /profile/verify` (multipart form):**
```typescript
// Fields: cnicFront (file), cnicBack (file), selfie (file), cnicNumber (string)
// 1. Validate CNIC format: /^\d{5}-\d{7}-\d{1}$/
// 2. Upload all 3 files to Cloudinary, get secure URLs
// 3. Create VerificationRequest row
// 4. Notify admin (email + dashboard badge)
```

**`PATCH /admin/verifications/:id`:**
```typescript
// body: { action: 'APPROVE' | 'REJECT', reason?: string }

// On APPROVE:
//   - request.status = APPROVED
//   - user.isVerified = true
//   - user.cnicNumber = request.cnicNumber  (locked, unique)
//   - user.gender = CNIC last digit odd -> MALE, even -> FEMALE
//   - Push + DB notification: "Your identity has been verified"

// On REJECT:
//   - request.status = REJECTED, rejectionReason = reason
//   - Notify user with specific reason so they can resubmit correctly
```

**CNIC gender derivation (Pakistan CNIC standard):**
```typescript
// Last digit of 13-digit CNIC: odd = MALE, even = FEMALE
const lastDigit = parseInt(cnicNumber.replace(/-/g, '').slice(-1));
const gender = lastDigit % 2 === 1 ? 'MALE' : 'FEMALE';
```

**Phase 2 — NADRA Verisys (automated):**
```typescript
// POST https://verisys.nadra.gov.pk/api/v1/cnic/verify
// { cnic: '12345-1234567-1', name: 'Muhammad Ali' }
// Response: { matched: boolean, name, dob, gender }
// On matched: auto-approve without admin review step
// Requires corporate registration with NADRA (~4 weeks processing)
```

---

### Frontend — `VerificationScreen` (4-step wizard)

**Step 1 — CNIC Number:**
- Masked TextInput: `_____-_______-_`
- Real-time format validation, green checkmark on valid.

**Step 2 — CNIC Front:**
- `expo-image-picker` camera capture.
- Preview thumbnail with "Retake" button.
- Tip card: "Lay the card flat, ensure all text is sharp and there is no glare."

**Step 3 — CNIC Back:**
- Same UI as Step 2.

**Step 4 — Selfie:**
- Front camera only (no gallery — prevents photo-of-a-photo attacks).
- Face oval overlay guide.
- Instruction: "Look directly at camera, good lighting, no sunglasses."

**Review & Submit:**
- Thumbnails of all 3 captures.
- Legal notice: "By submitting, you confirm this is your own identity document."

**`ProfileScreen`** — verification status card:
```
[NONE]     "Verify your identity"  →  [Verify Now]
[PENDING]  "Under review · Est. 24-48 h"
[APPROVED] "CNIC Verified"  (green shield badge)
[REJECTED] "Rejected: Document blurry"  →  [Resubmit]
```

**`TrustBadgesRow` addition:**
- New badge: `{ key: 'cnic', icon: 'shield-checkmark', label: 'CNIC Verified', color: '#22c55e' }`.
- Shown on driver cards in search, ride cards, and chat header.

---

## Feature 6 — Intercity / Long-Haul Rides

### Goal
Support multi-city corridor rides (Lahore–Islamabad, Karachi–Hyderabad) with per-segment booking and advance scheduling up to 7 days out.

---

### Stop Data Shape

```typescript
interface RideStop {
  city:           string;
  lat:            number;
  lng:            number;
  offsetMinutes:  number;   // minutes after departure time
  priceFromStart: number;   // cumulative PKR from origin to this stop
}
// stops[0] = origin, stops[last] = final destination
// Example: Lahore -> Rawalpindi -> Islamabad = 3 stops
```

---

### Database Schema

```prisma
// Booking model additions:
boardingStopIndex  Int    @default(0)
exitStopIndex      Int
segmentAmount      Int    // PKR for this passenger's segment

// Ride model additions:
rideType     RideType    @default(CITY)

enum RideType { CITY INTERCITY }
```

---

### Backend Changes

**`POST /rides` — intercity validation:**
```typescript
// For INTERCITY rides:
// - stops[] required, minimum 2 entries
// - date may be up to 7 days in the future (relax existing same-day guard)
// - Validate offsetMinutes is strictly increasing through stops[]
// - Pre-compute priceFromStart per stop based on segment distance ratios via OSRM
```

**`GET /rides/search` — intercity-aware matching:**
```typescript
// Standard city match:
WHERE fromCity = :from AND toCity = :to

// PLUS intercity intermediate match (PostgreSQL JSON path):
OR (
  rideType = 'INTERCITY'
  AND stops @> '[{"city": ":from"}]'
  AND EXISTS segment where :to appears at a higher index than :from
)
// Returns boardingStopIndex and exitStopIndex on each intercity result
```

**Segment pricing calculation:**
```typescript
function segmentAmount(ride: Ride, boardingIdx: number, exitIdx: number, seats: number): number {
  const stops = ride.stops as RideStop[];
  const from  = stops[boardingIdx].priceFromStart;
  const to    = stops[exitIdx].priceFromStart;
  return (to - from) * seats;
}
```

---

### Frontend Changes

**`SearchScreen`** — intercity additions:
- Date picker: today + up to 7 days forward.
- "Intercity" filter chip.
- Intercity ride cards show a vertical route timeline: each stop + estimated arrival offset.

**`PostRideScreen`** — stops editor:
- "Add Stop" button inserts a city + time-offset row.
- Drag handles for reordering stops.
- Per-segment price preview: "Lahore -> Rwp: Rs 350 · Rwp -> Islamabad: Rs 120."

**`BookingScreen`** — segment picker (intercity only):
```
Where are you boarding?
  ( ) Lahore  (origin)
  ( ) Rawalpindi  (+2h 30m)

Where are you getting off?
  ( ) Rawalpindi
  (*) Islamabad  (destination, +3h 10m)

Segment fare: Rs 350 x 1 seat = Rs 350
```

**`RideTrackingScreen`** — intercity additions:
- Stop markers on map (distinct from driver pin).
- "Next stop: Rawalpindi — 45 min" in the info panel.
- Driver can mark stop as reached, triggering boarding/alighting passenger notifications.

---

## Feature 7 — Driver Analytics Dashboard

### Goal
Give drivers clear visibility into earnings trends, popular routes, and rating health. Data-driven drivers post more rides.

---

### Backend — `GET /driver/analytics?period=7d|30d|90d`

```typescript
interface AnalyticsResponse {
  summary: {
    totalEarned:      number;  // PKR
    totalRides:       number;
    totalPassengers:  number;
    avgRating:        number;
    cancellationRate: number;  // 0.0 - 1.0
  };
  earningsByDay:  { date: string; amount: number }[];
  topRoutes:      { from: string; to: string; count: number; earned: number }[];
  ratingTrend:    { month: string; avg: number }[];   // last 6 months
  peakHours:      { hour: number; rides: number }[];  // 0-23
  greenImpact: {
    passengersCarried:    number;
    kgCO2Saved:           number;
    pkrSavedPassengers:   number;
  };
}
```

**Prisma aggregations (example for 30d):**
```typescript
const since = subDays(new Date(), 30);

const topRoutes = await prisma.ride.groupBy({
  by:      ['fromCity', 'toCity'],
  where:   { driverId, status: 'COMPLETED', createdAt: { gte: since } },
  _count:  { id: true },
  orderBy: { _count: { id: 'desc' } },
  take: 5,
});

const ratingTrend = await prisma.$queryRaw`
  SELECT DATE_TRUNC('month', "createdAt") as month, AVG(rating) as avg
  FROM "Review"
  WHERE "revieweeId" = ${driverId}
    AND "createdAt" >= ${subMonths(new Date(), 6)}
  GROUP BY 1
  ORDER BY 1
`;
```

**Caching**: Redis key `analytics:{driverId}:{period}`, TTL 15 minutes. Invalidated on new completed ride.

---

### Frontend — `AnalyticsScreen`

**Layout (scrollable):**

1. **Period selector tabs** — 7d / 30d / 90d. Refetches on change.

2. **Summary strip** (horizontal scroll of stat cards):
   ```
   [ Rs 12,450 ] [ 34 rides ] [ 87 passengers ] [ 4.8 avg ] [ 2.1% cancel ]
   ```

3. **Earnings bar chart** (react-native-gifted-charts):
   - x-axis: day of week / date
   - y-axis: PKR earned
   - Tap a bar to see ride list for that day

4. **Top Routes ranked list:**
   ```
   #1  Lahore -> Islamabad   ×12 rides · Rs 4,200
   #2  Lahore -> Rawalpindi  ×8 rides  · Rs 1,600
   ```

5. **Peak Hours heatmap:**
   - 24 colored cells (1 per hour), saturation = ride frequency
   - Caption: "You drive most between 8 AM and 9 AM"

6. **Rating Trend line chart** (6 months):
   - Annotate months below 4.0 with a warning dot.

7. **Green Impact card:**
   - "87 passengers saved an extra car trip — ~342 kg CO2 avoided."

**Navigation entry point**: new "Stats" option inside EarningsTab or added as an icon to DriverProfileTab.

---

## Feature 8 — Referral & Ride Credits

### Goal
Low-cost acquisition via WhatsApp referral links. Both referrer and new user earn Rs 50 after the new user's first completed ride.

---

### Database Schema

```prisma
// User model additions:
referralCode          String   @unique @default(cuid())  // human-readable, generated on signup
referredById          String?
referredBy            User?    @relation("Referrals", fields: [referredById], references: [id])
referrals             User[]   @relation("Referrals")
hasCompletedFirstRide Boolean  @default(false)

model Credit {
  id          String       @id @default(cuid())
  userId      String
  user        User         @relation(fields: [userId], references: [id])
  amount      Int          // paisas
  source      CreditSource
  description String
  expiresAt   DateTime?
  usedAt      DateTime?
  bookingId   String?      // which booking consumed this credit
  createdAt   DateTime     @default(now())
}

enum CreditSource { REFERRAL PROMO REFUND SUPPORT }
```

---

### Backend Changes

**`POST /auth/register` — referral capture:**
```typescript
// Accept optional { referralCode } in request body
// Resolve to referrer user, set newUser.referredById = referrer.id
// Generate code: first 5 chars of name (uppercased) + random 2-digit suffix
// Example: "JAMAL73"

function generateReferralCode(name: string): string {
  const base   = name.replace(/\s/g, '').toUpperCase().slice(0, 5).padEnd(5, 'X');
  const suffix = String(Math.floor(Math.random() * 90) + 10);
  return `${base}${suffix}`;
}
```

**Ride completion hook — referral credit dispatch:**
```typescript
// Runs inside ride.service.updateStatus when status -> COMPLETED
for (const booking of confirmedBookings) {
  const passenger = booking.passenger;

  if (!passenger.hasCompletedFirstRide) {
    await prisma.user.update({
      where: { id: passenger.id },
      data:  { hasCompletedFirstRide: true },
    });

    if (passenger.referredById) {
      // Reward referrer
      await prisma.credit.create({
        data: {
          userId:      passenger.referredById,
          amount:      5000,   // Rs 50 in paisas
          source:      'REFERRAL',
          description: `${passenger.name} completed their first ride`,
          expiresAt:   addDays(new Date(), 90),
        },
      });
      notificationDispatcher.send(passenger.referredById, {
        title: 'Referral bonus!',
        body:  `${passenger.name} just completed their first ride. Rs 50 added to your credits.`,
      });
    }

    // Welcome bonus for the new user
    await prisma.credit.create({
      data: {
        userId:      passenger.id,
        amount:      5000,
        source:      'REFERRAL',
        description: 'Welcome bonus — first ride complete',
        expiresAt:   addDays(new Date(), 90),
      },
    });
  }
}
```

**New routes:**
```
GET  /profile/referral    Code, share URL, earned total, pending count
GET  /credits             User's available and expired credits
```

**`GET /profile/referral` response:**
```typescript
{
  code:          'JAMAL73',
  shareUrl:      'https://chalparo.pk/join?ref=JAMAL73',
  whatsappText:  'چل پاڑو! پاکستان کی بہترین کارپول ایپ۔ میرے ساتھ سائن اپ کریں اور پہلی سواری پر Rs 50 پائیں:',
  referredCount: 3,    // signed up
  pendingCount:  1,    // signed up but no completed ride yet
  totalEarned:   150,  // PKR credited so far
}
```

**Credit application in `POST /bookings`:**
```typescript
// Optional { useCredit: true } in body
// Sum non-expired, unused credits for the passenger
// Deduct from booking.totalAmount (floor at 0 — credit cannot produce a refund)
// Mark applied credits with usedAt + bookingId
```

---

### Frontend Changes

**`ReferralScreen`** (`app/src/screens/profile/ReferralScreen.tsx`):
- Large code display with one-tap copy button.
- Primary CTA: "Share on WhatsApp" (`Linking.openURL('whatsapp://send?text=...')`).
- Stats: "3 friends joined · Rs 150 earned · 1 friend yet to take their first ride."
- Progress list: each referred user (name only) with status "Joined" or "First ride pending."
- Credit expiry banner if any credit expires within 14 days.

**`ProfileScreen`** — "Refer & Earn" card:
- Shows current available credit balance.
- Taps to ReferralScreen.

**`BookingScreen`** — credit application toggle (requires Feature 1):
```
Available credit: Rs 50  (expires in 23 days)
[x] Apply credit
    Fare Rs 200 - Rs 50 credit = Rs 150 due
```

---

## Build Order & Dependencies

### Phase Timeline

```
Phase 1 — Trust & Safety  (Weeks 1-6)
  Feature 5: CNIC Verification, manual admin review    no dependencies
  Feature 2: Women-Safety Mode                         soft dep: Feature 5 gender derivation
  Feature 7: Driver Analytics Dashboard                no dependencies

Phase 2 — Supply Growth  (Weeks 7-10)
  Feature 3: Recurring / Template Rides                no hard dependencies
  Feature 4: Dynamic Pricing Suggestions               needs Redis (already in stack)

Phase 3 — Revenue & Scale  (Weeks 11-18)
  Feature 1: In-App Payments (JazzCash)                requires merchant account (~2 week approval)
  Feature 8: Referral & Credits                        hard dep: Feature 1 wallet
  Feature 6: Intercity / Long-Haul                     hard dep: Feature 1 advance payment hold
```

### Dependency Graph

```
F5 (CNIC Verify) ──> F2 (Women mode) ──> full trust layer
F7 (Analytics)        independent
F3 (Templates)        independent
F4 (Pricing)          needs Redis (in stack)
F1 (Payments) ──> F8 (Referral credits)
             └──> F6 (Intercity advance booking)
```

### Pre-Phase 3 Infrastructure Checklist

| Item | Lead Time | Owner |
|---|---|---|
| JazzCash merchant account application | 2-3 weeks | Business |
| EasyPaisa merchant onboarding | 2-3 weeks | Business |
| NADRA Verisys API registration (Phase 2 CNIC) | 4-6 weeks | Business + Legal |
| Fly.io cron process for template materialization | 1 day | Engineering |
| Admin web panel (verification queue + withdrawals) | 1 week | Engineering |
| EAS build with new native permissions | 1 day + store review | Engineering |

---

*ChalParo v2.0 Upgrade Plan — 2026-07-04*
