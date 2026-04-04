import { Request, Response } from 'express';
import { routingService } from '../services/routing.service';
import { locationService } from '../services/location.service';
import prisma from '../data-source';

export class TrackingController {
  // GET /api/v1/tracking/route/:rideId
  async getRoute(req: Request, res: Response) {
    try {
      const rideId = req.params.rideId as string;
      
      const ride = await prisma.ride.findUnique({
        where: { id: rideId }
      });

      if (!ride) {
        return res.status(404).json({ success: false, message: 'Ride not found' });
      }

      if (!ride.fromLng || !ride.fromLat || !ride.toLng || !ride.toLat) {
        return res.status(400).json({ success: false, message: 'Ride missing coordinate details' });
      }

      const routeData = await routingService.getRoute(
        rideId,
        ride.fromLng,
        ride.fromLat,
        ride.toLng,
        ride.toLat
      );

      return res.status(200).json({ success: true, data: routeData });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  }

  // GET /api/v1/tracking/location/:rideId
  async getLatestLocation(req: Request, res: Response) {
    try {
      const rideId = req.params.rideId as string;
      const location = await locationService.getLatestLocation(rideId);
      
      if (!location) {
        return res.status(404).json({ success: false, message: 'No location found for this ride yet' });
      }

      return res.status(200).json({ success: true, data: location });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  }

  // POST /api/v1/tracking/update-location (rest fallback)
  async updateLocation(req: Request, res: Response) {
    try {
      const { rideId, latitude, longitude, speed, heading } = req.body;

      if (!rideId || latitude === undefined || longitude === undefined) {
        return res.status(400).json({ success: false, message: 'Missing required parameters' });
      }

      await locationService.addLocation({ rideId, latitude, longitude, speed, heading });
      
      return res.status(200).json({ success: true, message: 'Location updated via REST' });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
  }
}

export const trackingController = new TrackingController();
