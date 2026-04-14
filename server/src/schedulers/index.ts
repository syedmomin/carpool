import prisma from '../data-source';

// ─── Auto-complete past rides ─────────────────────────────────────────────────
export async function completeExpiredRides(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const result = await prisma.ride.updateMany({
    where:  { date: { lt: today }, status: 'ACTIVE' },
    data:   { status: 'COMPLETED' },
  });
  if (result.count > 0)
    console.log(`[Scheduler] Auto-completed ${result.count} expired ride(s)`);
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

  // Run once on boot, then every 24 hours
  cleanAllOldNotifications().catch(e => console.error('[Scheduler] cleanOldNotifications error:', e));
  setInterval(() => {
    cleanAllOldNotifications().catch(e => console.error('[Scheduler] cleanOldNotifications error:', e));
  }, DAY);

  console.log('⏰ Schedulers started (rides: 6h, notifications: 24h)');
}
