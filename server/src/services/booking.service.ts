import { Booking } from '@prisma/client';
import prisma from '../data-source';
import { BaseService } from './base.service';
import { AppError } from '../utils/AppError';
import { sendPushNotification } from '../utils/firebase';

type CreateBookingDto = { rideId: string; passengerId: string; seats: number };
type UpdateBookingDto = { status?: 'CANCELLED' | 'COMPLETED' };

export class BookingService extends BaseService<Booking, CreateBookingDto, UpdateBookingDto> {
  protected get model() { return prisma.booking; }
  protected get modelName() { return 'Booking'; }

  async bookRide(rideId: string, passengerId: string, seats: number, data?: any): Promise<Booking> {
    // Atomic transaction — only critical DB operations (prevents double booking)
    const result = await prisma.$transaction(async (tx) => {
      const ride = await tx.ride.findUnique({ where: { id: rideId } });
      if (!ride) throw AppError.notFound('Ride not found');
      if (ride.status !== 'ACTIVE') throw AppError.badRequest('Ride is no longer active');
      if (ride.bookedSeats + seats > ride.totalSeats)
        throw AppError.badRequest(`Only ${ride.totalSeats - ride.bookedSeats} seat(s) available`);

      const existing = await tx.booking.findFirst({
        where: { rideId, passengerId, status: 'CONFIRMED' },
      });
      if (existing) throw AppError.conflict('You already have a booking for this ride');

      const booking = await tx.booking.create({
        data: {
          rideId, passengerId, seats,
          status: 'PENDING',
          totalAmount: ride.pricePerSeat * seats,
          boardingCity: (data as any)?.boardingCity || ride.fromCity,
          exitCity: (data as any)?.exitCity || ride.toCity,
          boardingOrder: (data as any)?.boardingOrder ?? 0,
          exitOrder: (data as any)?.exitOrder ?? 1,
          createdBy: passengerId,
          updatedBy: passengerId,
        },
      });

      await tx.ride.update({
        where: { id: rideId },
        data: { bookedSeats: { increment: seats } },
      });

      // In-app notification record
      await tx.notification.create({
        data: {
          userId: passengerId,
          title: 'Booking Request Sent!',
          message: `Your request for ${ride.fromCity} → ${ride.toCity} is sent to the driver.`,
          type: 'BOOKING',
          rideId,
        },
      });

      // Re-fetch booking with full nested data
      const full = await tx.booking.findUnique({
        where: { id: booking.id },
        include: {
          ride: {
            include: {
              driver: { select: { id: true, name: true, avatar: true, phone: true, reviewsReceived: { select: { rating: true } } } },
              vehicle: { select: { id: true, brand: true, model: true, plateNumber: true, type: true, images: true, totalSeats: true, ac: true, wifi: true } },
            },
          },
        },
      });

      return { booking: full || booking, ride };
    }, { maxWait: 10000, timeout: 15000 });

    // ─── Side-effects AFTER transaction commit (non-blocking) ─────────────
    const { booking, ride } = result;

    // Real-time Socket sync (Notify Driver)
    try {
      const { emitToUser } = await import('../socket');
      emitToUser(ride.driverId, 'BOOKING_REQUESTED', {
        bookingId: booking.id,
        rideId,
        passengerId,
        seats,
        message: 'New ride request received'
      });
    } catch (e) { console.error('Socket emit failed:', e); }

    // Push notifications — fire and forget
    try {
      const passenger = await prisma.user.findUnique({
        where: { id: passengerId },
        select: { fcmToken: true },
      });
      if (passenger?.fcmToken) {
        sendPushNotification(
          passenger.fcmToken,
          'Booking Request Sent! 📩',
          `Your ${ride.fromCity} → ${ride.toCity} request is pending driver approval.`,
          { rideId, screen: 'BookingHistory' },
        ).catch(e => console.error('Push to passenger failed:', e));
      }

      const driver = await prisma.user.findUnique({
        where: { id: ride.driverId },
        select: { fcmToken: true },
      });
      if (driver?.fcmToken) {
        sendPushNotification(
          driver.fcmToken,
          'New Booking! 🚗',
          `${seats} seat(s) booked on your ${ride.fromCity} → ${ride.toCity} ride`,
          { rideId, screen: 'MyRides' },
        ).catch(e => console.error('Push to driver failed:', e));
      }
    } catch (e) { console.error('Push notification failed:', e); }

    return booking;
  }

  async acceptBooking(bookingId: string, driverId: string): Promise<Booking> {
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { ride: true }
      });
      if (!booking) throw AppError.notFound('Booking not found');
      if (booking.ride.driverId !== driverId) throw AppError.forbidden('Not your ride');
      if (booking.status !== 'PENDING') throw AppError.badRequest('Booking is not pending');

      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CONFIRMED' },
      });

      // Notify passenger record
      await tx.notification.create({
        data: {
          userId: booking.passengerId,
          title: 'Booking Confirmed!',
          message: `Your ${booking.ride.fromCity} → ${booking.ride.toCity} booking is accepted.`,
          type: 'BOOKING',
          rideId: booking.rideId,
        },
      });

      return { updated, booking };
    }, { maxWait: 10000, timeout: 15000 });

    // ─── Side-effects AFTER transaction commit ─────────────────────────────
    const { updated, booking } = result;

    try {
      const { emitToUser } = await import('../socket');
      emitToUser(booking.passengerId, 'BOOKING_ACCEPTED', {
        bookingId,
        rideId: booking.rideId,
        status: 'CONFIRMED'
      });
    } catch (e) { console.error('Socket emit failed:', e); }

    try {
      const passenger = await prisma.user.findUnique({
        where: { id: booking.passengerId },
        select: { fcmToken: true },
      });
      if (passenger?.fcmToken) {
        sendPushNotification(
          passenger.fcmToken,
          'Booking Confirmed! 🎉',
          `Your ${booking.ride.fromCity} → ${booking.ride.toCity} seat is confirmed!`,
          { rideId: booking.rideId, screen: 'BookingHistory' },
        ).catch(e => console.error('Push to passenger failed:', e));
      }
    } catch (e) { console.error('Push notification failed:', e); }

    return updated;
  }

  async rejectBooking(bookingId: string, driverId: string): Promise<Booking> {
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { ride: true }
      });
      if (!booking) throw AppError.notFound('Booking not found');
      if (booking.ride.driverId !== driverId) throw AppError.forbidden('Not your ride');
      if (booking.status !== 'PENDING') throw AppError.badRequest('Booking is not pending');

      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'REJECTED' },
      });

      // Release seats
      await tx.ride.update({
        where: { id: booking.rideId },
        data: { bookedSeats: { decrement: booking.seats } },
      });

      // Notify passenger record
      await tx.notification.create({
        data: {
          userId: booking.passengerId,
          title: 'Booking Rejected',
          message: `Your request for ${booking.ride.fromCity} → ${booking.ride.toCity} was not accepted.`,
          type: 'BOOKING',
          rideId: booking.rideId,
        },
      });

      return { updated, booking };
    }, { maxWait: 10000, timeout: 15000 });

    // ─── Side-effects AFTER transaction commit ─────────────────────────────
    const { updated, booking } = result;

    try {
      const { emitToUser } = await import('../socket');
      emitToUser(booking.passengerId, 'BOOKING_REJECTED', {
        bookingId,
        rideId: booking.rideId,
        status: 'REJECTED'
      });
    } catch (e) { console.error('Socket emit failed:', e); }

    try {
      const passenger = await prisma.user.findUnique({
        where: { id: booking.passengerId },
        select: { fcmToken: true },
      });
      if (passenger?.fcmToken) {
        sendPushNotification(
          passenger.fcmToken,
          'Booking Rejected ❌',
          `Sorry, your request for ${booking.ride.fromCity} → ${booking.ride.toCity} was rejected.`,
          { rideId: booking.rideId, screen: 'BookingHistory' },
        ).catch(e => console.error('Push to passenger failed:', e));
      }
    } catch (e) { console.error('Push notification failed:', e); }

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
        data: {
          status: 'CANCELLED',
          cancellationReason: reason,
          updatedBy: userId
        },
      });

      const ride = await tx.ride.update({
        where: { id: booking.rideId },
        data: { bookedSeats: { decrement: booking.seats } },
      });

      return { updated, booking, ride };
    }, { maxWait: 10000, timeout: 15000 });

    // ─── Side-effects AFTER transaction commit ─────────────────────────────
    const { updated, booking, ride } = result;

    try {
      const { emitToUser } = await import('../socket');
      emitToUser(ride.driverId, 'BOOKING_CANCELLED', {
        bookingId: booking.id,
        rideId: ride.id,
        passengerId: userId,
        message: 'A passenger cancelled their booking'
      });
    } catch (e) {
      console.error('Socket emit for cancellation failed:', e);
    }

    try {
      const driver = await prisma.user.findUnique({
        where: { id: ride.driverId },
        select: { fcmToken: true },
      });
      if (driver?.fcmToken) {
        const msg = reason
          ? `A passenger cancelled ${booking.seats} seat(s) on your ${ride.fromCity} → ${ride.toCity} ride. Reason: ${reason}`
          : `A passenger cancelled ${booking.seats} seat(s) on your ${ride.fromCity} → ${ride.toCity} ride`;

        sendPushNotification(
          driver.fcmToken,
          'Booking Cancelled ❌',
          msg,
          { rideId: ride.id, screen: 'MyRides' },
        ).catch(e => console.error('Push to driver failed:', e));
      }
    } catch (e) { console.error('Push notification failed:', e); }

    return updated;
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
              driver: { select: { id: true, name: true, avatar: true, phone: true, city: true, isVerified: true, reviewsReceived: { select: { rating: true } } } },
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
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }
}

export const bookingService = new BookingService();
