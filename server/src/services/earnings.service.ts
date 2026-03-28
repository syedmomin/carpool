import prisma from '../data-source';

type Period = 'all' | 'month' | 'week';

export class EarningsService {
  async getDriverEarnings(driverId: string, period: Period = 'all') {
    const dateFilter = this.getDateFilter(period);

    const rides = await prisma.ride.findMany({
      where: {
        driverId,
        ...(dateFilter ? { createdAt: { gte: dateFilter } } : {}),
      },
      include: {
        bookings: {
          where:  { status: { not: 'CANCELLED' } },
          select: { seats: true, totalAmount: true, status: true, createdAt: true },
        },
        vehicle: { select: { brand: true, plateNumber: true } },
      },
      orderBy: { date: 'desc' },
    });

    const totalEarnings   = rides.reduce((sum, r) =>
      sum + r.bookings.reduce((bs, b) => bs + b.totalAmount, 0), 0);
    const totalPassengers = rides.reduce((sum, r) =>
      sum + r.bookings.reduce((bs, b) => bs + b.seats, 0), 0);
    const completedRides  = rides.filter(r => r.status === 'COMPLETED').length;
    const activeRides     = rides.filter(r => r.status === 'ACTIVE').length;
    const avgPerRide      = completedRides > 0
      ? Math.round(totalEarnings / completedRides) : 0;

    const rideBreakdown = rides.map(r => ({
      id:            r.id,
      from:          r.fromCity,
      to:            r.toCity,
      date:          r.date,
      status:        r.status,
      vehicle:       r.vehicle,
      bookingsCount: r.bookings.length,
      passengers:    r.bookings.reduce((s, b) => s + b.seats, 0),
      earned:        r.bookings.reduce((s, b) => s + b.totalAmount, 0),
    }));

    return {
      summary: {
        totalEarnings,
        totalPassengers,
        completedRides,
        activeRides,
        avgPerRide,
        period,
      },
      rides: rideBreakdown,
    };
  }

  private getDateFilter(period: Period): Date | null {
    const now = new Date();
    if (period === 'week') {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    }
    if (period === 'month') {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return null;
  }
}

export const earningsService = new EarningsService();
