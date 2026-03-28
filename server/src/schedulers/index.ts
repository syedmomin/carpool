import prisma from '../data-source';

// ─── Scheduler: Auto-complete past rides ──────────────────────────────────────
// Run this every day via cron (e.g. node-cron or a cloud scheduler)

export async function completeExpiredRides(): Promise<void> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const result = await prisma.ride.updateMany({
    where: {
      date:   { lt: today },
      status: 'ACTIVE',
    },
    data: { status: 'COMPLETED' },
  });

  console.log(`[Scheduler] Completed ${result.count} expired rides`);
}

// ─── Scheduler: Clean old read notifications ──────────────────────────────────
export async function cleanOldNotifications(): Promise<void> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const result = await prisma.notification.deleteMany({
    where: {
      read:      true,
      createdAt: { lt: thirtyDaysAgo },
    },
  });

  console.log(`[Scheduler] Deleted ${result.count} old notifications`);
}
