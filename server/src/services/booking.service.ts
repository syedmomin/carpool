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
          totalAmount: ride.pricePerSeat * seats,
          boardingCity: (data as any)?.boardingCity || ride.fromCity,
          exitCity:     (data as any)?.exitCity     || ride.toCity,
          boardingOrder:(data as any)?.boardingOrder ?? 0,
          exitOrder:    (data as any)?.exitOrder     ?? 1,
          createdBy: passengerId,
          updatedBy: passengerId,
        },
      });

      await tx.ride.update({
        where: { id: rideId },
        data:  { bookedSeats: { increment: seats } },
      });

      // In-app notification
      await tx.notification.create({
        data: {
          userId:  passengerId,
          title:   'Booking Confirmed!',
          message: `Your ${ride.fromCity} → ${ride.toCity} booking for ${ride.date} is confirmed.`,
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
          'Booking Confirmed! 🎉',
          `Your ${ride.fromCity} → ${ride.toCity} seat is confirmed for ${ride.date}`,
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

      return booking;
    });
  }

  async cancelBooking(bookingId: string, userId: string): Promise<Booking> {
    return prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: bookingId } });
      if (!booking)                         throw AppError.notFound('Booking not found');
      if (booking.passengerId !== userId)   throw AppError.forbidden('Not your booking');
      if (booking.status !== 'CONFIRMED')   throw AppError.badRequest('Booking is already cancelled');

      const updated = await tx.booking.update({
        where: { id: bookingId },
        data:  { status: 'CANCELLED', updatedBy: userId },
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
        await sendPushNotification(
          driver.fcmToken,
          'Booking Cancelled ❌',
          `A passenger cancelled ${booking.seats} seat(s) on your ${ride.fromCity} → ${ride.toCity} ride`,
          { rideId: ride.id, screen: 'MyRides' },
        );
      }

      return updated;
    });
  }

  async getMyBookings(passengerId: string) {
    return prisma.booking.findMany({
      where:   { passengerId },
      include: {
        ride: {
          include: {
            driver:  { select: { name: true, avatar: true } },
            vehicle: { select: { brand: true, plateNumber: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const bookingService = new BookingService();
