import { Ride } from '@prisma/client';
import prisma from '../data-source';
import { BaseService } from './base.service';
import { PaginationQuery } from '../types';
import { AppError } from '../utils/AppError';
import { notify, notifyMany } from '../utils/notificationDispatcher';

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
    const fromNorm = from?.trim().toLowerCase();
    const toNorm   = to?.trim().toLowerCase();

    // ── DB-level pre-filter: only load rides that could possibly match ──────
    // Multi-stop rides always pass through (stop cities are in JSON).
    // For direct rides, require fromCity or toCity to match the query.
    const where: any = {
      status:     'ACTIVE',
      bookedSeats: { lt: prisma.ride.fields?.totalSeats as any }, // guarded below
      ...(date ? { date } : {}),
    };

    // Build targeted OR filter so we don't pull the entire rides table
    if (fromNorm || toNorm) {
      where.OR = [
        { isMultiStop: true }, // multi-stop: can't filter stops at DB level without raw SQL
        ...(fromNorm ? [
          { fromCity: { equals: fromNorm, mode: 'insensitive' } },
          { toCity:   { equals: fromNorm, mode: 'insensitive' } },
        ] : []),
        ...(toNorm ? [
          { toCity:   { equals: toNorm, mode: 'insensitive' } },
          { fromCity: { equals: toNorm, mode: 'insensitive' } },
        ] : []),
      ];
    }

    // Remove the Prisma fields reference — use JS post-filter for availability
    delete where.bookedSeats;

    const rides = await prisma.ride.findMany({
      where,
      include:  INCLUDE,
      orderBy:  { pricePerSeat: 'asc' }, // sort at DB level
    });

    const matched: any[] = [];

    for (const ride of rides) {
      if (ride.totalSeats - ride.bookedSeats <= 0) continue;

      const cities = getOrderedCities(ride);

      if (!fromNorm && !toNorm) { matched.push(withRating(ride)); continue; }

      const fromIdx = fromNorm ? cities.findIndex(c => c.toLowerCase() === fromNorm) : 0;
      const toIdx   = toNorm   ? cities.findIndex(c => c.toLowerCase() === toNorm)   : cities.length - 1;

      if (fromIdx === -1 || toIdx === -1) continue;
      if (fromIdx >= toIdx) continue;

      const totalSegments = cities.length - 1;
      const segmentCount  = toIdx - fromIdx;
      const segmentPrice  = Math.max(1, Math.round((ride.pricePerSeat / totalSegments) * segmentCount));

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

    return matched; // already sorted by pricePerSeat at DB level
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

    if (data.fromCity.trim().toLowerCase() === data.toCity.trim().toLowerCase()) {
      throw AppError.badRequest('Departure and destination cities cannot be the same.');
    }

    if (data.isMultiStop && data.stops) {
      const cityList = [data.fromCity.toLowerCase(), ...data.stops.map(s => s.city.toLowerCase()), data.toCity.toLowerCase()];
      const uniqueCities = new Set(cityList);
      if (uniqueCities.size !== cityList.length) {
        throw AppError.badRequest('Route cannot have duplicate cities or stops that match the departure/destination.');
      }
    }

    // Validate departure date+time is not in the past
    if (data.date && data.departureTime) {
      const [y, m, d] = data.date.split('-').map(Number);
      const [h, min]  = data.departureTime.split(':').map(Number);
      const departure = new Date(y, m - 1, d, h, min);
      const buffer = new Date();
      buffer.setMinutes(buffer.getMinutes() + 15); // 15 min buffer
      if (departure <= buffer) {
        throw AppError.badRequest('Departure time must be at least 15 minutes in the future.');
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
      await notifyMany({
        userIds: alerts.map(a => a.passengerId),
        title:   'Ride Available on Your Route! 🚗',
        message: `${data.fromCity} → ${data.toCity} on ${data.date} at ${data.departureTime} — Book now!`,
        type:    'NEW_RIDE',
        rideId:  ride.id,
      });
    }

    // Broadcast via socket to all passengers
    try {
      const { broadcastEvent } = await import('../socket');
      broadcastEvent('NEW_RIDE', {
        id: ride.id,
        from: ride.fromCity,
        to: ride.toCity,
        fromCity: ride.fromCity, // keeping for compatibility
        toCity: ride.toCity,     // keeping for compatibility
        date: ride.date,
        departureTime: ride.departureTime,
        pricePerSeat: ride.pricePerSeat,
        totalSeats: ride.totalSeats,
        bookedSeats: ride.bookedSeats,
        driver: {
          id: ride.driver.id,
          name: ride.driver.name,
          avatar: (ride.driver as any).avatar
        },
        vehicle: ride.vehicle ? {
          type: ride.vehicle.type,
          brand: ride.vehicle.brand,
          model: ride.vehicle.model,
          plateNumber: ride.vehicle.plateNumber
        } : null
      });
    } catch (e) { console.error('Socket broadcast failed:', e); }

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

    if (newStatus === 'IN_PROGRESS') {
      const otherInProgress = await prisma.ride.findFirst({
        where: { driverId, status: 'IN_PROGRESS', id: { not: rideId } }
      });
      if (otherInProgress) {
        throw AppError.badRequest('You already have another ride in progress. Please complete it first.');
      }
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
      }

      return r;
    });

    // Cleanup outside transaction — these are non-critical and can be slow
    if (newStatus === 'COMPLETED') {
      await prisma.chatMessage.deleteMany({ where: { booking: { rideId } } }).catch(() => {});
      await prisma.rideLocation.deleteMany({ where: { rideId } }).catch(() => {});
    }

    // ─── Post-Transaction Notifications & Side Effects ───────────────────────
    if (newStatus === 'COMPLETED') {
      // Fetch confirmed passenger IDs
      const bookings = await prisma.booking.findMany({
        where:  { rideId, status: 'COMPLETED' },
        select: { passengerId: true },
      });
      const passengerIds = bookings.map(b => b.passengerId);

      // Notify all passengers: ride complete, rate your driver
      if (passengerIds.length) {
        notifyMany({
          userIds:     passengerIds,
          title:       'Ride Completed! ⭐ Rate Your Driver',
          message:     `Your ${updated.fromCity} → ${updated.toCity} ride is complete. Share your feedback!`,
          type:        'RIDE',
          rideId,
          socketEvent: 'RIDE_COMPLETED',
          socketData:  {
            status: 'COMPLETED',
            driverId: updated.driverId,
            routeLabel: `${updated.fromCity} → ${updated.toCity}`,
          },
        });
      }

      // Notify driver: ride complete
      notify({
        userId:  driverId,
        title:   'Ride Completed! 🏁',
        message: `Your ${updated.fromCity} → ${updated.toCity} ride has been completed.`,
        type:    'RIDE',
        rideId,
      });

      // Socket broadcast to ride room
      try {
        const { emitToRideRoom } = await import('../socket');
        emitToRideRoom(rideId, 'RIDE_COMPLETED', {
          rideId, status: 'COMPLETED',
          driverId: updated.driverId,
          routeLabel: `${updated.fromCity} → ${updated.toCity}`,
          date: updated.date,
        });
      } catch (e) { console.error('[Socket] RIDE_COMPLETED emit failed:', e); }

    } else if (newStatus === 'IN_PROGRESS') {
      const bookings = await prisma.booking.findMany({
        where:  { rideId, status: 'CONFIRMED' },
        select: { passengerId: true },
      });
      const passengerIds = bookings.map(b => b.passengerId);

      // Notify all confirmed passengers: ride has started
      if (passengerIds.length) {
        notifyMany({
          userIds:     passengerIds,
          title:       'Your Ride Has Started! 🚗',
          message:     `${updated.fromCity} → ${updated.toCity} — Your driver is on the way!`,
          type:        'RIDE',
          rideId,
          socketEvent: 'RIDE_STARTED',
          socketData:  { rideId, status: 'IN_PROGRESS' },
        });
      }

      // Socket broadcast to ride room
      try {
        const { emitToRideRoom } = await import('../socket');
        emitToRideRoom(rideId, 'RIDE_STARTED', {
          rideId,
          status:        'IN_PROGRESS',
          driverName:    updated.driver?.name,
          fromCity:      updated.fromCity,
          toCity:        updated.toCity,
          date:          updated.date,
          departureTime: updated.departureTime,
        });
      } catch (e) { console.error('[Socket] RIDE_STARTED emit failed:', e); }
    }

    return withRating(updated);
  }

  // ── Cancel ride — driver cancels their own ride ──────────────────────────
  async cancelRide(rideId: string, driverId: string): Promise<any> {
    const ride = await prisma.ride.findFirst({
      where: { id: rideId, driverId },
      include: INCLUDE,
    });
    if (!ride) throw AppError.notFound('Ride not found');
    if (ride.status === 'IN_PROGRESS') throw AppError.badRequest('Cannot cancel a ride that is already in progress');
    if (ride.status === 'COMPLETED')   throw AppError.badRequest('Cannot cancel a completed ride');
    if (ride.status === 'CANCELLED')   throw AppError.badRequest('Ride is already cancelled');

    // Find all passengers with PENDING or CONFIRMED bookings
    const affectedBookings = await prisma.booking.findMany({
      where:  { rideId, status: { in: ['PENDING', 'CONFIRMED'] } },
      select: { passengerId: true, id: true },
    });

    await prisma.$transaction(async (tx) => {
      // Cancel the ride
      await tx.ride.update({
        where: { id: rideId },
        data:  { status: 'CANCELLED', updatedBy: driverId },
      });
      // Cancel all active bookings
      await tx.booking.updateMany({
        where: { rideId, status: { in: ['PENDING', 'CONFIRMED'] } },
        data:  { status: 'CANCELLED', updatedBy: driverId },
      });
    });

    const passengerIds = affectedBookings.map(b => b.passengerId);

    // Notify all affected passengers
    if (passengerIds.length) {
      notifyMany({
        userIds:     passengerIds,
        title:       'Ride Cancelled by Driver ❌',
        message:     `The ${ride.fromCity} → ${ride.toCity} ride on ${ride.date} at ${ride.departureTime} has been cancelled by the driver.`,
        type:        'RIDE_CANCELLED',
        rideId,
        socketEvent: 'RIDE_CANCELLED',
        socketData:  { rideId, fromCity: ride.fromCity, toCity: ride.toCity, date: ride.date },
      });
    }

    // Notify driver: confirmation of cancellation
    notify({
      userId:  driverId,
      title:   'Ride Cancelled',
      message: `Your ${ride.fromCity} → ${ride.toCity} ride on ${ride.date} has been cancelled.`,
      type:    'RIDE_CANCELLED',
      rideId,
    });

    return { success: true };
  }

  // ── Update ride — only the owning driver can update ───────────────────────
  async updateRide(rideId: string, driverId: string, data: UpdateRideDto): Promise<any> {
    const ride = await prisma.ride.findFirst({ where: { id: rideId, driverId } });
    if (!ride) throw AppError.notFound('Ride not found or you are not the owner');
    if (ride.status !== 'ACTIVE') throw AppError.badRequest('Only ACTIVE rides can be updated');
    const updated = await prisma.ride.update({
      where: { id: rideId },
      data: { ...data, updatedBy: driverId } as any,
      include: INCLUDE,
    });
    return withRating(updated);
  }

  // ── Delete ride — only the owning driver (or admin) can delete ────────────
  async deleteRide(rideId: string, userId: string, role: string): Promise<void> {
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw AppError.notFound('Ride not found');
    if (role !== 'ADMIN' && ride.driverId !== userId) throw AppError.forbidden('Not your ride');
    if (ride.status === 'IN_PROGRESS') throw AppError.badRequest('Cannot delete a ride that is in progress');
    await prisma.ride.delete({ where: { id: rideId } });
  }

  // ── Get active ride session (Driver or Passenger) ─────────────────────────
  async getActiveSession(userId: string): Promise<any> {
    // 1. Check if user is a driver with an IN_PROGRESS ride
    const driverRide = await prisma.ride.findFirst({
      where: { driverId: userId, status: 'IN_PROGRESS' },
      include: INCLUDE,
    });
    if (driverRide) return { role: 'driver', ride: withRating(driverRide) };

    // 2. Check if user is a passenger in an IN_PROGRESS ride
    const passengerBooking = await prisma.booking.findFirst({
      where: { 
        passengerId: userId, 
        status: 'CONFIRMED', 
        ride: { status: 'IN_PROGRESS' } 
      },
      include: { ride: { include: INCLUDE } },
    });
    if (passengerBooking) return { role: 'passenger', ride: withRating(passengerBooking.ride) };

    return null;
  }

  // ── Small helper (avoids importing parsePagination separately) ────────────
  private parsePaginationSimple(query: PaginationQuery) {
    const page  = Math.max(1, Number(query.page)  || 1);
    const limit = Math.min(100, Number(query.limit) || 20);
    return { skip: (page - 1) * limit, take: limit };
  }
}

export const rideService = new RideService();
