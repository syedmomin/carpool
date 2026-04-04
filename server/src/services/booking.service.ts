import { Booking } from '@prisma/client';
import prisma from '../data-source';
import { BaseService } from './base.service';
import { AppError } from '../utils/AppError';
import { sendPushNotification } from '../utils/firebase';

type CreateBookingDto = { rideId: string; passengerId: string; seats: number };
type UpdateBookingDto = { status?: 'CANCELLED' | 'COMPLETED' };

export class BookingService extends BaseService<Booking, CreateBookingDto, UpdateBookingDto> {
  protected get model()     { return prisma.booking; }
  protected get modelName() { return 'Booking'; }

  async bookRide(rideId: string, passengerId: string, seats: number, data?: any): Promise<Booking> {
    // Atomic transaction — prevents double booking
    return prisma.$transaction(async (tx) => {
      const ride = await tx.ride.findUnique({ where: { id: rideId } });
      if (!ride)                        throw AppError.notFound('Ride not found');
      if (ride.status !== 'ACTIVE')     throw AppError.badRequest('Ride is no longer active');
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
          exitCity:     (data as any)?.exitCity     || ride.toCity,
          boardingOrder:(data as any)?.boardingOrder ?? 0,
          exitOrder:    (data as any)?.exitOrder     ?? 1,
          createdBy: passengerId,
          updatedBy: passengerId,
        },
      });

      // Notice: We do NOT increment bookedSeats yet.
      // We only reserve them if we want to prevent over-requesting, 
      // but the user said "not auto confirm".
      // Usually, it's safer to increment it now (as pending) to avoid overbooking,
      // and decrement if rejected. 
      // I'll keep the increment on request to ensure availability.
      await tx.ride.update({
        where: { id: rideId },
        data:  { bookedSeats: { increment: seats } },
      });

      // In-app notification
      await tx.notification.create({
        data: {
          userId:  passengerId,
          title:   'Booking Request Sent!',
          message: `Your request for ${ride.fromCity} → ${ride.toCity} is sent to the driver.`,
          type:    'BOOKING',
          rideId,
        },
      });

      // Push notification — even if app is closed
      const passenger = await tx.user.findUnique({
        where:  { id: passengerId },
        select: { fcmToken: true },
      });
      if (passenger?.fcmToken) {
        await sendPushNotification(
          passenger.fcmToken,
          'Booking Request Sent! 📩',
          `Your ${ride.fromCity} → ${ride.toCity} request is pending driver approval.`,
          { rideId, screen: 'BookingHistory' },
        );
      }

      // Notify driver about new passenger
      const driver = await tx.user.findUnique({
        where:  { id: ride.driverId },
        select: { fcmToken: true },
      });
      if (driver?.fcmToken) {
        await sendPushNotification(
          driver.fcmToken,
          'New Booking! 🚗',
          `${seats} seat(s) booked on your ${ride.fromCity} → ${ride.toCity} ride`,
          { rideId, screen: 'MyRides' },
        );
      }

      // Re-fetch booking with full nested data
      const full = await tx.booking.findUnique({
        where:   { id: booking.id },
        include: {
          ride: {
            include: {
              driver:  { select: { id: true, name: true, avatar: true, phone: true, reviewsReceived: { select: { rating: true } } } },
              vehicle: { select: { id: true, brand: true, model: true, plateNumber: true, type: true, images: true, totalSeats: true, ac: true, wifi: true } },
            },
          },
        },
      });
      return full || booking;
    });
  }

  async acceptBooking(bookingId: string, driverId: string): Promise<Booking> {
    return prisma.$transaction(async (tx) => {
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

      // Notify passenger
      await tx.notification.create({
        data: {
          userId:  booking.passengerId,
          title:   'Booking Confirmed!',
          message: `Your ${booking.ride.fromCity} → ${booking.ride.toCity} booking is accepted.`,
          type:    'BOOKING',
          rideId:  booking.rideId,
        },
      });

      const passenger = await tx.user.findUnique({
        where: { id: booking.passengerId },
        select: { fcmToken: true },
      });
      if (passenger?.fcmToken) {
        await sendPushNotification(
          passenger.fcmToken,
          'Booking Confirmed! 🎉',
          `Your ${booking.ride.fromCity} → ${booking.ride.toCity} seat is confirmed!`,
          { rideId: booking.rideId, screen: 'BookingHistory' },
        );
      }

      return updated;
    });
  }

  async rejectBooking(bookingId: string, driverId: string): Promise<Booking> {
    return prisma.$transaction(async (tx) => {
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

      // Notify passenger
      await tx.notification.create({
        data: {
          userId:  booking.passengerId,
          title:   'Booking Rejected',
          message: `Your request for ${booking.ride.fromCity} → ${booking.ride.toCity} was not accepted.`,
          type:    'BOOKING',
          rideId:  booking.rideId,
        },
      });

      const passenger = await tx.user.findUnique({
        where: { id: booking.passengerId },
        select: { fcmToken: true },
      });
      if (passenger?.fcmToken) {
        await sendPushNotification(
          passenger.fcmToken,
          'Booking Rejected ❌',
          `Sorry, your request for ${booking.ride.fromCity} → ${booking.ride.toCity} was rejected.`,
          { rideId: booking.rideId, screen: 'BookingHistory' },
        );
      }

      return updated;
    });
  }

  async cancelBooking(bookingId: string, userId: string, reason?: string): Promise<Booking> {
    return prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: bookingId } });
      if (!booking)                         throw AppError.notFound('Booking not found');
      if (booking.passengerId !== userId)   throw AppError.forbidden('Not your booking');
      if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED')
        throw AppError.badRequest('Booking cannot be cancelled in current state');

      const updated = await tx.booking.update({
        where: { id: bookingId },
        data:  { 
          status: 'CANCELLED', 
          cancellationReason: reason,
          updatedBy: userId 
        },
      });

      const ride = await tx.ride.update({
        where: { id: booking.rideId },
        data:  { bookedSeats: { decrement: booking.seats } },
      });

      // Push to driver about cancellation
      const driver = await tx.user.findUnique({
        where:  { id: ride.driverId },
        select: { fcmToken: true },
      });
      if (driver?.fcmToken) {
        const msg = reason 
          ? `A passenger cancelled ${booking.seats} seat(s) on your ${ride.fromCity} → ${ride.toCity} ride. Reason: ${reason}`
          : `A passenger cancelled ${booking.seats} seat(s) on your ${ride.fromCity} → ${ride.toCity} ride`;
          
        await sendPushNotification(
          driver.fcmToken,
          'Booking Cancelled ❌',
          msg,
          { rideId: ride.id, screen: 'MyRides' },
        );
      }

      return updated;
    });
  }

  async getMyBookings(passengerId: string, page = 1, limit = 10) {
    const skip  = (page - 1) * limit;
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
