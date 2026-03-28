import { Ride } from '@prisma/client';
import prisma from '../data-source';
import { BaseService } from './base.service';
import { PaginationQuery } from '../types';
import { AppError } from '../utils/AppError';
import { sendToMultiple } from '../utils/firebase';

type CreateRideDto = {
  driverId: string; vehicleId: string; fromCity: string; toCity: string;
  date: string; departureTime: string; arrivalTime?: string;
  pricePerSeat: number; totalSeats: number;
  pickupPoint?: string; dropPoint?: string; description?: string; amenities?: string[];
};
type UpdateRideDto = Partial<Omit<CreateRideDto, 'driverId'>>;

const INCLUDE = {
  driver:  { select: { id: true, name: true, avatar: true } },
  vehicle: { select: { brand: true, model: true, plateNumber: true, type: true } },
};

export class RideService extends BaseService<Ride, CreateRideDto, UpdateRideDto> {
  protected get model()     { return prisma.ride; }
  protected get modelName() { return 'Ride'; }

  async search(from: string, to: string, date?: string): Promise<Ride[]> {
    return prisma.ride.findMany({
      where: {
        fromCity: { equals: from, mode: 'insensitive' },
        toCity:   { equals: to,   mode: 'insensitive' },
        status:   'ACTIVE',
        ...(date ? { date } : {}),
        bookedSeats: { lt: prisma.ride.fields.totalSeats as any },
      },
      include: INCLUDE,
      orderBy: { pricePerSeat: 'asc' },
    }) as any;
  }

  async getDriverRides(driverId: string, query: PaginationQuery) {
    return this.getAll(query, { driverId }, INCLUDE);
  }

  async postRide(data: CreateRideDto, createdBy: string): Promise<Ride> {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: data.vehicleId, driverId: createdBy, isActive: true },
    });
    if (!vehicle) throw AppError.badRequest('No active vehicle found. Please set an active vehicle first.');

    const ride = await this.create(data, createdBy);

    // Check schedule alerts — notify matching passengers
    const alerts = await prisma.scheduleAlert.findMany({
      where: {
        fromCity: { equals: data.fromCity, mode: 'insensitive' },
        toCity:   { equals: data.toCity,   mode: 'insensitive' },
        date:     data.date,
      },
    });

    if (alerts.length > 0) {
      // In-app notifications
      await prisma.notification.createMany({
        data: alerts.map(alert => ({
          userId:  alert.passengerId,
          title:   'Your Scheduled Ride is Available!',
          message: `A driver posted ${data.fromCity} → ${data.toCity} on ${data.date} at ${data.departureTime}`,
          type:    'NEW_RIDE' as any,
          rideId:  ride.id,
        })),
      });

      // Push notifications to matched passengers
      const passengers = await prisma.user.findMany({
        where:  { id: { in: alerts.map(a => a.passengerId) }, fcmToken: { not: null } },
        select: { fcmToken: true },
      });
      const tokens = passengers.map(p => p.fcmToken!).filter(Boolean);
      if (tokens.length) {
        await sendToMultiple(
          tokens,
          'Your Scheduled Ride is Here! 🚗',
          `${data.fromCity} → ${data.toCity} on ${data.date} at ${data.departureTime} — Book now!`,
          { rideId: ride.id, screen: 'RideDetail' },
        );
      }
    }

    return ride;
  }
}

export const rideService = new RideService();
