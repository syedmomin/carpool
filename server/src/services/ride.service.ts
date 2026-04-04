import { Ride } from '@prisma/client';
import prisma from '../data-source';
import { BaseService } from './base.service';
import { PaginationQuery } from '../types';
import { AppError } from '../utils/AppError';
import { sendToMultiple } from '../utils/firebase';

type RideStop = { city: string; order: number; arrivalTime?: string };

type CreateRideDto = {
  driverId: string; vehicleId: string; fromCity: string; toCity: string;
  fromLat?: number; fromLng?: number; toLat?: number; toLng?: number;
  isMultiStop?: boolean; stops?: RideStop[];
  date: string; departureTime: string; arrivalTime?: string;
  pricePerSeat: number; totalSeats: number;
  pickupPoint?: string; dropPoint?: string; description?: string; amenities?: string[];
};
type UpdateRideDto = Partial<Omit<CreateRideDto, 'driverId'>>;

// ─── Include definition ───────────────────────────────────────────────────────
const INCLUDE = {
  driver: {
    select: {
      id: true, name: true, avatar: true, phone: true,
      reviewsReceived: { select: { rating: true } },
    },
  },
  vehicle: {
    select: {
      id: true, brand: true, model: true, plateNumber: true, type: true,
      images: true, totalSeats: true,
      ac: true, wifi: true, music: true, usbCharging: true,
      waterCooler: true, blanket: true, firstAid: true, luggageRack: true,
    },
  },
  bookings: {
    include: {
      passenger: {
        select: { id: true, name: true, phone: true, avatar: true },
      },
    },
    orderBy: { createdAt: 'desc' as any },
  },
};

// ─── Compute avg rating from nested reviewsReceived ──────────────────────────
function withRating(ride: any): any {
  if (!ride?.driver) return ride;
  const reviews: { rating: number }[] = ride.driver.reviewsReceived || [];
  const avg = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : null;
  const { reviewsReceived, ...driverRest } = ride.driver;
  return {
    ...ride,
    driver: { ...driverRest, rating: avg, reviewCount: reviews.length },
  };
}

// Build full city list for a ride: [fromCity, ...stops ordered, toCity]
function getOrderedCities(ride: any): string[] {
  const cities: string[] = [ride.fromCity];
  if (ride.isMultiStop && Array.isArray(ride.stops)) {
    const sorted = [...ride.stops].sort((a: RideStop, b: RideStop) => a.order - b.order);
    sorted.forEach((s: RideStop) => cities.push(s.city));
  }
  cities.push(ride.toCity);
  return cities;
}

export class RideService extends BaseService<Ride, CreateRideDto, UpdateRideDto> {
  protected get model()     { return prisma.ride; }
  protected get modelName() { return 'Ride'; }

  // ── Get all public rides (with driver + vehicle) ──────────────────────────
  async getAllRides(query: PaginationQuery) {
    const { skip, take } = this.parsePaginationSimple(query);
    const [data, total] = await Promise.all([
      prisma.ride.findMany({
        where:   { status: 'ACTIVE' },
        include: INCLUDE,
        skip, take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.ride.count({ where: { status: 'ACTIVE' } }),
    ]);
    const page  = Number(query.page)  || 1;
    const limit = Number(query.limit) || 20;
    return {
      data:  data.map(withRating),
      meta:  { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Get single ride with full details ─────────────────────────────────────
  async getRideById(id: string): Promise<any> {
    const ride = await prisma.ride.findUnique({ where: { id }, include: INCLUDE });
    if (!ride) throw AppError.notFound('Ride not found');
    return withRating(ride);
  }

  // ── Search with stop-based matching ───────────────────────────────────────
  async search(from: string, to: string, date?: string): Promise<any[]> {
    const where: any = {
      status: 'ACTIVE',
      ...(date ? { date } : {}),
    };

    const allRides = await prisma.ride.findMany({ where, include: INCLUDE });
    const matched: any[] = [];

    for (const ride of allRides) {
      const available = ride.totalSeats - ride.bookedSeats;
      if (available <= 0) continue;

      const cities = getOrderedCities(ride);
      const fromNorm = from?.trim().toLowerCase();
      const toNorm   = to?.trim().toLowerCase();

      if (!fromNorm && !toNorm) { matched.push(withRating(ride)); continue; }

      const fromIdx = fromNorm ? cities.findIndex(c => c.toLowerCase() === fromNorm) : 0;
      const toIdx   = toNorm   ? cities.findIndex(c => c.toLowerCase() === toNorm)   : cities.length - 1;

      if (fromIdx === -1 || toIdx === -1) continue;
      if (fromIdx >= toIdx) continue;

      const totalSegments = cities.length - 1;
      const segmentCount  = toIdx - fromIdx;
      const segmentPrice  = Math.round((ride.pricePerSeat / totalSegments) * segmentCount);

      matched.push(withRating({
        ...ride,
        boardingCity:  cities[fromIdx],
        exitCity:      cities[toIdx],
        boardingOrder: fromIdx,
        exitOrder:     toIdx,
        segmentPrice,
        isSegment: fromIdx > 0 || toIdx < cities.length - 1,
      }));
    }

    return matched.sort((a, b) => a.pricePerSeat - b.pricePerSeat);
  }

  // ── Driver's rides ────────────────────────────────────────────────────────
  async getDriverRides(driverId: string, query: PaginationQuery) {
    const { skip, take } = this.parsePaginationSimple(query);
    const [data, total] = await Promise.all([
      prisma.ride.findMany({
        where:   { driverId },
        include: INCLUDE,
        skip, take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.ride.count({ where: { driverId } }),
    ]);
    const page  = Number(query.page)  || 1;
    const limit = Number(query.limit) || 20;
    return {
      data:  data.map(withRating),
      meta:  { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Post ride ─────────────────────────────────────────────────────────────
  async postRide(data: CreateRideDto, createdBy: string): Promise<any> {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: data.vehicleId, driverId: createdBy },
    });
    if (!vehicle) throw AppError.badRequest('Vehicle not found. Please register a vehicle first.');

    // Validate departure date+time is not in the past
    if (data.date && data.departureTime) {
      const [y, m, d] = data.date.split('-').map(Number);
      const [h, min]  = data.departureTime.split(':').map(Number);
      const departure = new Date(y, m - 1, d, h, min);
      if (departure <= new Date()) {
        throw AppError.badRequest('Departure time has already passed. Please select a future date and time.');
      }
    }

    // Create ride and return with full relations
    const ride = await prisma.ride.create({
      data: {
        ...data,
        stops: data.stops ? JSON.stringify(data.stops) : undefined,
        createdBy,
        updatedBy: createdBy,
      } as any,
      include: INCLUDE,
    });

    // Schedule alert notifications
    const citiesToCheck = [data.fromCity, ...(data.stops?.map(s => s.city) || []), data.toCity];
    const alerts = await prisma.scheduleAlert.findMany({
      where: {
        fromCity: { in: citiesToCheck, mode: 'insensitive' } as any,
        date: data.date,
      },
    });

    if (alerts.length > 0) {
      await prisma.notification.createMany({
        data: alerts.map(alert => ({
          userId:  alert.passengerId,
          title:   'Ride Available on Your Route!',
          message: `${data.fromCity} → ${data.toCity} on ${data.date} at ${data.departureTime}`,
          type:    'NEW_RIDE' as any,
          rideId:  ride.id,
        })),
      });

      const passengers = await prisma.user.findMany({
        where:  { id: { in: alerts.map(a => a.passengerId) }, fcmToken: { not: null } },
        select: { fcmToken: true },
      });
      const tokens = passengers.map(p => p.fcmToken!).filter(Boolean);
      if (tokens.length) {
        await sendToMultiple(
          tokens,
          'Your Ride Alert! 🚗',
          `${data.fromCity} → ${data.toCity} on ${data.date} — Book now!`,
          { rideId: ride.id, screen: 'RideDetail' },
        );
      }
    }

    return withRating(ride);
  }

  // ── Update ride status (ACTIVE → IN_PROGRESS → COMPLETED) ───────────────
  async updateStatus(rideId: string, driverId: string, newStatus: string): Promise<any> {
    const ride = await prisma.ride.findFirst({ where: { id: rideId, driverId } });
    if (!ride) throw AppError.notFound('Ride not found');

    const allowed: Record<string, string> = {
      ACTIVE:      'IN_PROGRESS',
      IN_PROGRESS: 'COMPLETED',
    };
    if (allowed[ride.status] !== newStatus) {
      throw AppError.badRequest(`Cannot change status from ${ride.status} to ${newStatus}`);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const r = await tx.ride.update({
        where: { id: rideId },
        data:  { status: newStatus as any, updatedBy: driverId },
        include: INCLUDE,
      });

      if (newStatus === 'COMPLETED') {
        // Mark all confirmed bookings as completed
        await tx.booking.updateMany({
          where: { rideId, status: 'CONFIRMED' },
          data:  { status: 'COMPLETED', updatedBy: driverId },
        });

        // Notify passengers
        const bookings = await tx.booking.findMany({
          where:   { rideId },
          include: { passenger: { select: { fcmToken: true, name: true } } },
        });
        const tokens = bookings
          .map(b => b.passenger.fcmToken)
          .filter((t): t is string => !!t);

        if (tokens.length) {
          const { sendToMultiple } = await import('../utils/firebase');
          await sendToMultiple(
            tokens,
            'Ride Completed! ⭐ Rate Your Driver',
            `Your ${r.fromCity} → ${r.toCity} ride is complete. Share your feedback!`,
            { screen: 'BookingHistory' },
          );
        }
      } else if (newStatus === 'IN_PROGRESS') {
        // Notify passengers ride has started
        const bookings = await tx.booking.findMany({
          where:   { rideId, status: 'CONFIRMED' },
          include: { passenger: { select: { fcmToken: true } } },
        });
        const tokens = bookings
          .map(b => b.passenger.fcmToken)
          .filter((t): t is string => !!t);

        if (tokens.length) {
          const { sendToMultiple } = await import('../utils/firebase');
          await sendToMultiple(
            tokens,
            'Your Ride Has Started! 🚗',
            `${r.fromCity} → ${r.toCity} — Your driver is on the way!`,
            { screen: 'BookingHistory' },
          );
        }
      }

      return r;
    });

    return withRating(updated);
  }

  // ── Small helper (avoids importing parsePagination separately) ────────────
  private parsePaginationSimple(query: PaginationQuery) {
    const page  = Math.max(1, Number(query.page)  || 1);
    const limit = Math.min(100, Number(query.limit) || 20);
    return { skip: (page - 1) * limit, take: limit };
  }
}

export const rideService = new RideService();
