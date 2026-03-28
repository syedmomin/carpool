import { Response, NextFunction } from 'express';
import { BaseController } from './base.controller';
import { vehicleService } from '../services/vehicle.service';
import { ResponseUtil } from '../utils/response';
import { AuthRequest } from '../types';
import { Vehicle } from '@prisma/client';

export class VehicleController extends BaseController<Vehicle, any, any> {
  protected service = vehicleService;

  getMyVehicles = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vehicles = await vehicleService.getMyVehicles(req.user!.id);
      ResponseUtil.success(res, vehicles, `${vehicles.length} vehicle(s) found`);
    } catch (err) { next(err); }
  };

  register = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vehicle = await vehicleService.registerVehicle(
        { ...req.body, driverId: req.user!.id },
        req.user!.id,
      );
      ResponseUtil.created(res, vehicle, 'Vehicle registered successfully');
    } catch (err) { next(err); }
  };

  updateVehicle = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vehicle = await vehicleService.updateVehicle(req.params.id, req.body, req.user!.id);
      ResponseUtil.success(res, vehicle, 'Vehicle updated');
    } catch (err) { next(err); }
  };

  deleteVehicle = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await vehicleService.deleteVehicle(req.params.id, req.user!.id);
      ResponseUtil.noContent(res);
    } catch (err) { next(err); }
  };

  setActive = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vehicle = await vehicleService.setActive(req.params.id, req.user!.id);
      ResponseUtil.success(res, vehicle, 'Active vehicle updated');
    } catch (err) { next(err); }
  };
}

export const vehicleController = new VehicleController();
