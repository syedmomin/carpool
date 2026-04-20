import prisma from '../data-source';
import { notify, notifyMany } from '../utils/notificationDispatcher';
import { getPakistanToday } from '../utils/date';

// ─── Auto-expire rides that passed with NO bookings at all ───────────────────
export async function expireRidesWithNoBookings(): Promise<void> {
  const today = getPakistanToday();

  // Find all ACTIVE rides whose date has passed and have zero bookings
  const expiredRides = await prisma.ride.findMany({
    where: {
      date:     { lt: today },
      status:   'ACTIVE',
      bookings: { none: {} },
    },
    select: { id: true, driverId: true, fromCity: true, toCity: true, date: true, departureTime: true },
  });

  if (!expiredRides.length) return;

  const rideIds = expiredRides.map(r => r.id);

  // Mark them EXPIRED
  await prisma.ride.updateMany({
    where: { id: { in: rideIds } },
    data:  { status: 'EXPIRED' },
  });

  // Notify each driver
  for (const ride of expiredRides) {
    notify({
      userId:  ride.driverId,
      title:   'Ride Expired – No Bookings 🚗',
      message: `Your ${ride.fromCity} → ${ride.toCity} ride on ${ride.date} at ${ride.departureTime} expired without any booking requests.`,
      type:    'RIDE_EXPIRED',
      rideId:  ride.id,
      socketEvent: 'RIDE_EXPIRED',
      socketData:  { rideId: ride.id, fromCity: ride.fromCity, toCity: ride.toCity, date: ride.date },
    }).catch(e => console.error('[Scheduler] notify RIDE_EXPIRED failed:', e));
  }

  console.log(`[Scheduler] Marked ${expiredRides.length} ride(s) as EXPIRED (no bookings)`);
}

// ─── Auto-complete past rides that HAD bookings ───────────────────────────────
export async function completeExpiredRides(): Promise<void> {
  const today = getPakistanToday();

  // Find ACTIVE rides with date in past that had at least one booking
  const ridesWithBookings = await prisma.ride.findMany({
    where: {
      date:     { lt: today },
      status:   'ACTIVE',
      bookings: { some: {} },
    },
    select: { id: true, driverId: true, fromCity: true, toCity: true, date: true },
  });

  if (!ridesWithBookings.length) return;

  const rideIds = ridesWithBookings.map(r => r.id);

  await prisma.ride.updateMany({
    where: { id: { in: rideIds } },
    data:  { status: 'COMPLETED' },
  });

  // Notify each driver their ride was auto-completed
  for (const ride of ridesWithBookings) {
    // Find confirmed passenger IDs for this ride
    const bookings = await prisma.booking.findMany({
      where:  { rideId: ride.id, status: { in: ['CONFIRMED', 'PENDING'] } },
      select: { passengerId: true },
    });
    const passengerIds = bookings.map(b => b.passengerId);

    notify({
      userId:  ride.driverId,
      title:   'Ride Auto-Completed ✅',
      message: `Your ${ride.fromCity} → ${ride.toCity} ride on ${ride.date} has been automatically completed.`,
      type:    'RIDE',
      rideId:  ride.id,
    }).catch(() => {});

    if (passengerIds.length) {
      notifyMany({
        userIds:     passengerIds,
        title:       'Ride Completed ✅',
        message:     `Your ${ride.fromCity} → ${ride.toCity} ride on ${ride.date} has been completed.`,
        type:        'RIDE',
        rideId:      ride.id,
        socketEvent: 'RIDE_COMPLETED',
        socketData:  { rideId: ride.id, fromCity: ride.fromCity, toCity: ride.toCity, date: ride.date },
      }).catch(() => {});
    }
  }

  console.log(`[Scheduler] Auto-completed ${ridesWithBookings.length} expired ride(s) with bookings`);
}

// ─── Delete read notifications older than 30 days ────────────────────────────
export async function cleanOldNotifications(): Promise<void> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const result = await prisma.notification.deleteMany({
    where: { read: true, createdAt: { lt: thirtyDaysAgo } },
  });
  if (result.count > 0)
    console.log(`[Scheduler] Deleted ${result.count} old notification(s)`);
}

// ─── Delete ALL notifications older than 30 days (read or unread) ────────────
export async function cleanAllOldNotifications(): Promise<void> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const result = await prisma.notification.deleteMany({
    where: { createdAt: { lt: thirtyDaysAgo } },
  });
  if (result.count > 0)
    console.log(`[Scheduler] Purged ${result.count} notification(s) older than 30 days`);
}

// ─── Auto-expire OPEN schedule requests whose date has passed ────────────────
export async function expireOldScheduleRequests(): Promise<void> {
  const today = getPakistanToday();

  // Find OPEN requests whose date has passed
  const expiring = await prisma.scheduleRequest.findMany({
    where: { status: 'OPEN', date: { lt: today } },
    select: { id: true, passengerId: true, fromCity: true, toCity: true, date: true },
  });

  if (!expiring.length) return;

  const ids = expiring.map(r => r.id);

  // Mark status as EXPIRED in DB
  await prisma.scheduleRequest.updateMany({
    where: { id: { in: ids } },
    data:  { status: 'EXPIRED' },
  });

  // Notify each passenger so the app updates via socket instantly
  for (const req of expiring) {
    notify({
      userId:      req.passengerId,
      title:       'Request Expired 📋',
      message:     `Your request from ${req.fromCity} to ${req.toCity} on ${req.date} has expired. No driver bids were accepted in time.`,
      type:        'RIDE_EXPIRED',
      socketEvent: 'REQUEST_EXPIRED',
      socketData:  { scheduleRequestId: req.id, fromCity: req.fromCity, toCity: req.toCity },
    }).catch(e => console.error('[Scheduler] notify REQUEST_EXPIRED failed:', e));
  }

  console.log(`[Scheduler] Expired ${expiring.length} old schedule request(s) and notified passengers.`);
}

// ─── Delete chat messages from completed rides older than 10 days ────────────
export async function cleanOldChatMessages(): Promise<void> {
  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  const result = await prisma.chatMessage.deleteMany({
    where: {
      createdAt: { lt: tenDaysAgo },
      booking: { ride: { status: 'COMPLETED' } },
    },
  });
  if (result.count > 0)
    console.log(`[Scheduler] Deleted ${result.count} old chat message(s)`);
}

// ─── Bootstrap all schedulers ────────────────────────────────────────────────
// Called once from server startup. Uses setInterval — no external cron dependency.
export function startSchedulers(): void {
  const HOUR = 60 * 60 * 1000;
  const DAY  = 24 * HOUR;

  // Run once immediately on boot, then every 6 hours
  completeExpiredRides().catch(e => console.error('[Scheduler] completeExpiredRides error:', e));
  setInterval(() => {
    completeExpiredRides().catch(e => console.error('[Scheduler] completeExpiredRides error:', e));
  }, 6 * HOUR);

  // Expire rides with no bookings — run on boot then every 6 hours
  expireRidesWithNoBookings().catch(e => console.error('[Scheduler] expireRidesWithNoBookings error:', e));
  setInterval(() => {
    expireRidesWithNoBookings().catch(e => console.error('[Scheduler] expireRidesWithNoBookings error:', e));
  }, 6 * HOUR);

  // Run once on boot, then every 24 hours
  cleanAllOldNotifications().catch(e => console.error('[Scheduler] cleanOldNotifications error:', e));
  setInterval(() => {
    cleanAllOldNotifications().catch(e => console.error('[Scheduler] cleanOldNotifications error:', e));
  }, DAY);

  // Expire old schedule requests — run on boot then every 6 hours
  expireOldScheduleRequests().catch(e => console.error('[Scheduler] expireOldScheduleRequests error:', e));
  setInterval(() => {
    expireOldScheduleRequests().catch(e => console.error('[Scheduler] expireOldScheduleRequests error:', e));
  }, 6 * HOUR);

  // Clean old chat messages — run on boot then every 24 hours
  cleanOldChatMessages().catch(e => console.error('[Scheduler] cleanOldChatMessages error:', e));
  setInterval(() => {
    cleanOldChatMessages().catch(e => console.error('[Scheduler] cleanOldChatMessages error:', e));
  }, DAY);

  console.log('⏰ Schedulers started (rides: 6h, notifications/chat: 24h)');
}
