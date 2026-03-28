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

const INCLUDE = {
  driver:  { select: { id: true, name: true, avatar: true, phone: true } },
  vehicle: { select: { brand: true, model: true, plateNumber: true, type: true, ac: true, wifi: true, music: true, usbCharging: true, waterCooler: true, blanket: true, firstAid: true, luggageRack: true, totalSeats: true } },
};

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

  // Search with stop-based matching
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

      // Allow empty from/to (show all)
      if (!fromNorm && !toNorm) { matched.push(ride); continue; }

      const fromIdx = fromNorm ? cities.findIndex(c => c.toLowerCase() === fromNorm) : 0;
      const toIdx   = toNorm   ? cities.findIndex(c => c.toLowerCase() === toNorm)   : cities.length - 1;

      if (fromIdx === -1 || toIdx === -1) continue;
      if (fromIdx >= toIdx) continue; // wrong direction

      // Calculate segment price
      const totalCities = cities.length - 1; // number of segments
      const segmentCount = toIdx - fromIdx;
      const segmentPrice = Math.round((ride.pricePerSeat / totalCities) * segmentCount);

      matched.push({
        ...ride,
        boardingCity:  cities[fromIdx],
        exitCity:      cities[toIdx],
        boardingOrder: fromIdx,
        exitOrder:     toIdx,
        segmentPrice:  segmentPrice,
        isSegment:     fromIdx > 0 || toIdx < cities.length - 1,
      });
    }

    return matched.sort((a, b) => a.pricePerSeat - b.pricePerSeat);
  }

  async getDriverRides(driverId: string, query: PaginationQuery) {
    return this.getAll(query, { driverId }, INCLUDE);
  }

  async postRide(data: CreateRideDto, createdBy: string): Promise<Ride> {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: data.vehicleId, driverId: createdBy },
    });
    if (!vehicle) throw AppError.badRequest('Vehicle not found. Please register a vehicle first.');

    // Sanitize stops
    const sanitizedData: any = {
      ...data,
      stops: data.stops ? JSON.stringify(data.stops) : undefined,
    };

    const ride = await this.create(sanitizedData, createdBy);

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

    return ride;
  }
}

export const rideService = new RideService();
