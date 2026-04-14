import { Booking } from '@prisma/client';
import prisma from '../data-source';
import { BaseService } from './base.service';
import { AppError } from '../utils/AppError';
import { notify } from '../utils/notificationDispatcher';

type CreateBookingDto = { rideId: string; passengerId: string; seats: number };
type UpdateBookingDto = { status?: 'CANCELLED' | 'COMPLETED' };

export class BookingService extends BaseService<Booking, CreateBookingDto, UpdateBookingDto> {
  protected get model() { return prisma.booking; }
  protected get modelName() { return 'Booking'; }

  async bookRide(rideId: string, passengerId: string, seats: number, data?: any): Promise<Booking> {
    const result = await prisma.$transaction(async (tx) => {
      const ride = await tx.ride.findUnique({ where: { id: rideId } });
      if (!ride) throw AppError.notFound('Ride not found');
      if (ride.status !== 'ACTIVE') throw AppError.badRequest('Ride is no longer active');

      const existing = await tx.booking.findFirst({
        where: { rideId, passengerId, status: 'CONFIRMED' },
      });
      if (existing) throw AppError.conflict('You already have a booking for this ride');

      // Atomic seat reservation
      const updated = await tx.ride.updateMany({
        where: { id: rideId, bookedSeats: { lte: ride.totalSeats - seats } },
        data:  { bookedSeats: { increment: seats } },
      });
      if (updated.count === 0)
        throw AppError.badRequest(`Only ${ride.totalSeats - ride.bookedSeats} seat(s) available`);

      const booking = await tx.booking.create({
        data: {
          rideId, passengerId, seats,
          status:       'PENDING',
          totalAmount:  ride.pricePerSeat * seats,
          boardingCity: (data as any)?.boardingCity || ride.fromCity,
          exitCity:     (data as any)?.exitCity     || ride.toCity,
          boardingOrder: (data as any)?.boardingOrder ?? 0,
          exitOrder:     (data as any)?.exitOrder    ?? 1,
          createdBy: passengerId,
          updatedBy: passengerId,
        },
      });

      const full = await tx.booking.findUnique({
        where: { id: booking.id },
        include: {
          ride: {
            include: {
              driver:  { select: { id: true, name: true, avatar: true, phone: true, reviewsReceived: { select: { rating: true } } } },
              vehicle: { select: { id: true, brand: true, model: true, plateNumber: true, type: true, images: true, totalSeats: true, ac: true, wifi: true } },
            },
          },
        },
      });

      return { booking: full || booking, ride };
    }, { maxWait: 10000, timeout: 15000 });

    const { booking, ride } = result;

    // ── Notify Passenger: request sent ───────────────────────────────────────
    notify({
      userId:  passengerId,
      title:   'Booking Request Sent! 📩',
      message: `Your request for ${ride.fromCity} → ${ride.toCity} is pending driver approval.`,
      type:    'BOOKING',
      rideId,
    });

    // ── Notify Driver: new booking request ───────────────────────────────────
    notify({
      userId:       ride.driverId,
      title:        'New Booking Request! 🚗',
      message:      `${seats} seat(s) requested on your ${ride.fromCity} → ${ride.toCity} ride.`,
      type:         'BOOKING',
      rideId,
      socketEvent:  'BOOKING_REQUESTED',
      socketData:   { bookingId: booking.id, passengerId, seats },
    });

    return booking;
  }

  async acceptBooking(bookingId: string, driverId: string): Promise<Booking> {
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { ride: true },
      });
      if (!booking) throw AppError.notFound('Booking not found');
      if (booking.ride.driverId !== driverId) throw AppError.forbidden('Not your ride');
      if (booking.status !== 'PENDING') throw AppError.badRequest('Booking is not pending');

      const updated = await tx.booking.update({
        where: { id: bookingId },
        data:  { status: 'CONFIRMED' },
      });

      return { updated, booking };
    }, { maxWait: 10000, timeout: 15000 });

    const { updated, booking } = result;

    // ── Notify Passenger: accepted ────────────────────────────────────────────
    notify({
      userId:      booking.passengerId,
      title:       'Booking Confirmed! 🎉',
      message:     `Your ${booking.ride.fromCity} → ${booking.ride.toCity} seat is confirmed!`,
      type:        'BOOKING',
      rideId:      booking.rideId,
      socketEvent: 'BOOKING_ACCEPTED',
      socketData:  { bookingId, status: 'CONFIRMED' },
    });

    return updated;
  }

  async rejectBooking(bookingId: string, driverId: string): Promise<Booking> {
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { ride: true },
      });
      if (!booking) throw AppError.notFound('Booking not found');
      if (booking.ride.driverId !== driverId) throw AppError.forbidden('Not your ride');
      if (booking.status !== 'PENDING') throw AppError.badRequest('Booking is not pending');

      const updated = await tx.booking.update({
        where: { id: bookingId },
        data:  { status: 'REJECTED' },
      });

      await tx.ride.update({
        where: { id: booking.rideId },
        data:  { bookedSeats: { decrement: booking.seats } },
      });

      return { updated, booking };
    }, { maxWait: 10000, timeout: 15000 });

    const { updated, booking } = result;

    // ── Notify Passenger: rejected ────────────────────────────────────────────
    notify({
      userId:      booking.passengerId,
      title:       'Booking Rejected ❌',
      message:     `Sorry, your request for ${booking.ride.fromCity} → ${booking.ride.toCity} was not accepted.`,
      type:        'BOOKING',
      rideId:      booking.rideId,
      socketEvent: 'BOOKING_REJECTED',
      socketData:  { bookingId, status: 'REJECTED' },
    });

    return updated;
  }

  async cancelBooking(bookingId: string, userId: string, reason?: string): Promise<Booking> {
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: bookingId } });
      if (!booking) throw AppError.notFound('Booking not found');
      if (booking.passengerId !== userId) throw AppError.forbidden('Not your booking');
      if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED')
        throw AppError.badRequest('Booking cannot be cancelled in current state');

      const updated = await tx.booking.update({
        where: { id: bookingId },
        data:  { status: 'CANCELLED', cancellationReason: reason, updatedBy: userId },
      });

      const ride = await tx.ride.update({
        where: { id: booking.rideId },
        data:  { bookedSeats: { decrement: booking.seats } },
      });

      return { updated, booking, ride };
    }, { maxWait: 10000, timeout: 15000 });

    const { updated, booking, ride } = result;

    const msg = reason
      ? `A passenger cancelled ${booking.seats} seat(s) on your ${ride.fromCity} → ${ride.toCity} ride. Reason: ${reason}`
      : `A passenger cancelled ${booking.seats} seat(s) on your ${ride.fromCity} → ${ride.toCity} ride.`;

    // ── Notify Driver: booking cancelled ─────────────────────────────────────
    notify({
      userId:      ride.driverId,
      title:       'Booking Cancelled ❌',
      message:     msg,
      type:        'BOOKING',
      rideId:      ride.id,
      socketEvent: 'BOOKING_CANCELLED',
      socketData:  { bookingId: booking.id, passengerId: userId },
    });

    // ── Notify Passenger: cancellation confirmed ──────────────────────────────
    notify({
      userId:  userId,
      title:   'Booking Cancelled',
      message: `Your booking for ${ride.fromCity} → ${ride.toCity} has been cancelled.`,
      type:    'BOOKING',
      rideId:  ride.id,
    });

    return updated;
  }

  async getBookingForUser(bookingId: string, userId: string): Promise<Booking> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        ride: {
          include: {
            driver:  { select: { id: true, name: true, avatar: true, phone: true } },
            vehicle: { select: { id: true, brand: true, model: true, plateNumber: true, type: true, images: true } },
          },
        },
      },
    });
    if (!booking) throw AppError.notFound('Booking not found');
    const isPassenger = booking.passengerId === userId;
    const isDriver    = (booking.ride as any)?.driverId === userId;
    if (!isPassenger && !isDriver) throw AppError.forbidden('Not authorized to view this booking');
    return booking;
  }

  async getMyBookings(passengerId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where = { passengerId };
    const [data, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          ride: {
            include: {
              driver:  { select: { id: true, name: true, avatar: true, phone: true, city: true, isVerified: true, reviewsReceived: { select: { rating: true } } } },
              vehicle: { select: { id: true, brand: true, model: true, plateNumber: true, type: true, color: true, images: true, totalSeats: true, ac: true, wifi: true, music: true, usbCharging: true, waterCooler: true, blanket: true, firstAid: true, luggageRack: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);
    return {
      data,
      meta: {
        total, page, limit,
        totalPages: Math.ceil(total / limit),
        hasNext:    page < Math.ceil(total / limit),
        hasPrev:    page > 1,
      },
    };
  }
}

export const bookingService = new BookingService();
