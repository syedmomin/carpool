# ChalParo — Brand & Feature Overview

> **Pakistan ka #1 Carpooling App**
> چل پاڑو — Safe, affordable, and smart shared rides across Pakistan.

---

## Brand Identity

| Property        | Value                          |
|-----------------|-------------------------------|
| App Name        | **ChalParo** (چل پاڑو)        |
| Tagline         | *"Saath Chalein, Saath Bachaein"* |
| Primary Color   | `#1a73e8` — Brand Blue        |
| Dark Color      | `#0d1b4b` — Deep Navy         |
| Background      | `#f5f7ff` — Soft Blue-White   |
| Font Style      | Bold, rounded, modern         |
| Target Market   | Pakistan (Karachi, Lahore, Islamabad, Rawalpindi, Faisalabad, Peshawar) |
| Platform        | iOS + Android (React Native / Expo) |

---

## Core Features

### For Passengers
- **Search Rides** — Find rides between any two Pakistani cities with real-time city search
- **Smart Filters** — Filter by AC, vehicle type, brand, departure time, max price, female-only rides
- **Book Instantly** — One-tap seat booking with segment support (board/exit at custom stops)
- **Booking History** — Full history with status badges, driver details, and vehicle info
- **Rate Your Driver** — Post-ride star rating (1–5) with optional comment
- **Cancel Booking** — Cancel anytime with confirmation flow
- **Schedule Alerts** — Set a recurring route alert to be notified when matching rides are posted
- **SOS Emergency** — One-tap access to Rescue 1122, Police 15, Edhi 115, Motorway 130

### For Drivers
- **Post a Ride** — Set route, date, time, seats, price, stops
- **Manage Rides** — View upcoming, active, and past rides
- **Start Ride** — Ride activation only on the scheduled date (with booked passengers)
- **My Vehicles** — Register multiple vehicles with brand, model, year, AC, plate number, photos
- **Earnings Dashboard** — View earnings by ride with period filter (weekly/monthly/all-time)

### For Both
- **Profile** — Avatar, city, rating, member since, verification badges
- **CNIC Verification** — Upload front/back CNIC photos for identity verification
- **Notifications** — Real-time push notifications (Firebase FCM) + in-app inbox with mark-read
- **Change Password** — Secure password update
- **Help & Support** — In-app support, Terms, Privacy Policy, About
- **Single Brand Color** — Entire app uses one blue (`#1a73e8`) for consistent professional look

---

## Tech Stack

| Layer       | Technology                                      |
|-------------|-------------------------------------------------|
| Mobile App  | React Native + Expo SDK 54                      |
| Navigation  | React Navigation (Stack + Bottom Tabs)          |
| Backend     | Node.js + TypeScript + Express                  |
| Database    | PostgreSQL + Prisma ORM                         |
| Auth        | JWT tokens (encrypted storage)                  |
| Push Notifs | Firebase Cloud Messaging (FCM)                  |
| File Upload | Multer — per-user folder (`uploads/{userId}/`)  |
| City Search | OpenStreetMap Nominatim API                     |

---

## Navigation Design

- **Custom floating tab bar** — Active icon pops above the white bar in a brand-blue circle
- Inactive icons: grey (`#9ca3af`), active label: brand blue
- Edge-to-edge bar with rounded top corners
- Separate stacks for Passenger and Driver with shared screens

---

## Security & Trust

- JWT auth with encrypted AsyncStorage
- CNIC verification with admin approval flow
- Phone-verified accounts (`+92` prefix, 10-digit validation)
- Driver identity badge on profiles
- SOS emergency contacts always accessible during rides

---

## Supported Pakistani Car Brands

Toyota · Suzuki · Honda · Daihatsu · Mitsubishi · Nissan · Mazda · Subaru ·
Hyundai · Kia · Changan · MG · Proton · FAW · DFSK · Haval · Chery · BYD ·
Mercedes · BMW · Audi · Land Rover

---

## Roadmap

- [ ] Live ride tracking (Google Maps integration)
- [ ] In-app chat between driver and passenger
- [ ] JazzCash / EasyPaisa payment integration
- [ ] Referral and promo code system
- [ ] Driver license verification
- [ ] Repeat/recurring daily commute rides
- [ ] Rating for passengers by drivers

---

*Made in Pakistan 🇵🇰 — ChalParo v1.0*
