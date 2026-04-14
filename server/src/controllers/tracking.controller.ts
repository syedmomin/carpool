import { Response, NextFunction } from 'express';
import { routingService } from '../services/routing.service';
import { locationService } from '../services/location.service';
import { ResponseUtil } from '../utils/response';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../types';
import prisma from '../data-source';

export class TrackingController {
  // GET /api/v1/tracking/route/:rideId
  getRoute = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rideId = req.params.rideId as string;
      const ride = await prisma.ride.findUnique({ where: { id: rideId } });
      if (!ride) throw AppError.notFound('Ride not found');
      if (!ride.fromLng || !ride.fromLat || !ride.toLng || !ride.toLat)
        throw AppError.badRequest('Ride missing coordinate details');

      const routeData = await routingService.getRoute(rideId, ride.fromLng, ride.fromLat, ride.toLng, ride.toLat);
      ResponseUtil.success(res, routeData);
    } catch (err) { next(err); }
  };

  // GET /api/v1/tracking/location/:rideId
  getLatestLocation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const location = await locationService.getLatestLocation(req.params.rideId as string);
      if (!location) throw AppError.notFound('No location found for this ride yet');
      ResponseUtil.success(res, location);
    } catch (err) { next(err); }
  };

  // POST /api/v1/tracking/update-location (REST fallback — driver only)
  updateLocation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { rideId, latitude, longitude, speed, heading } = req.body;
      if (!rideId || latitude === undefined || longitude === undefined)
        throw AppError.badRequest('rideId, latitude, and longitude are required');

      // Verify the authenticated driver owns this ride
      const ride = await prisma.ride.findFirst({
        where: { id: rideId, driverId: req.user!.id, status: 'IN_PROGRESS' },
        select: { id: true },
      });
      if (!ride) throw AppError.forbidden('Not your active ride');

      await locationService.addLocation({ rideId, latitude, longitude, speed, heading });
      ResponseUtil.success(res, null, 'Location updated');
    } catch (err) { next(err); }
  };
}

export const trackingController = new TrackingController();
