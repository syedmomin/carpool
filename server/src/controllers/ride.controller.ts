import { Request, Response, NextFunction } from 'express';
import { BaseController } from './base.controller';
import { rideService } from '../services/ride.service';
import { ResponseUtil } from '../utils/response';
import { AuthRequest, PaginationQuery } from '../types';
import { Ride } from '@prisma/client';

export class RideController extends BaseController<Ride, any, any> {
  protected service = rideService;

  // Override: return all rides with driver + vehicle included
  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await rideService.getAllRides(req.query as unknown as PaginationQuery);
      ResponseUtil.paginated(res, result.data, result.meta.total, result.meta.page, result.meta.limit);
    } catch (err) { next(err); }
  };

  // Override: return single ride with driver + vehicle included
  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ride = await rideService.getRideById(req.params.id as string);
      ResponseUtil.success(res, ride);
    } catch (err) { next(err); }
  };

  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { from, to, date } = req.query as any;
      const rides = await rideService.search(from, to, date);
      ResponseUtil.success(res, rides, `${rides.length} ride(s) found`);
    } catch (err) { next(err); }
  };

  postRide = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ride = await rideService.postRide(
        { ...req.body, driverId: req.user!.id },
        req.user!.id,
      );
      ResponseUtil.created(res, ride, 'Ride posted successfully');
    } catch (err) { next(err); }
  };

  myRides = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await rideService.getDriverRides(
        req.user!.id,
        req.query as unknown as PaginationQuery,
      );
      ResponseUtil.paginated(res, result.data, result.meta.total, result.meta.page, result.meta.limit);
    } catch (err) { next(err); }
  };

  updateStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ride = await rideService.updateStatus(req.params.id as string, req.user!.id, String(req.body.status));
      ResponseUtil.success(res, ride, `Ride status updated to ${req.body.status}`);
    } catch (err) { next(err); }
  };
}

export const rideController = new RideController();
