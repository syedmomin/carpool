import { Response, NextFunction } from 'express';
import { BaseController } from './base.controller';
import { vehicleService } from '../services/vehicle.service';
import { storageService } from '../services/storage.service';
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
      const { id: userId } = req.user!;
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        if (req.body.images || req.body.image) {
          throw new Error('Images must be uploaded as multi-part binary files, not as simple text strings');
        }
      }

      // Upload files to Supabase if any
      const imageUrls = await storageService.uploadMultiple(files, 'vehicle', userId);
      
      // Merge URLs into body
      const payload = { 
        ...req.body, 
        images: imageUrls,
        totalSeats: parseInt(req.body.totalSeats),
        // Handle boolean fields from multipart form (they come as strings)
        ac: req.body.ac === 'true',
        wifi: req.body.wifi === 'true',
        music: req.body.music === 'true',
        usbCharging: req.body.usbCharging === 'true',
        waterCooler: req.body.waterCooler === 'true',
        blanket: req.body.blanket === 'true',
        firstAid: req.body.firstAid === 'true',
        luggageRack: req.body.luggageRack === 'true',
      };

      const vehicle = await vehicleService.registerVehicle(
        { ...payload, driverId: userId },
        userId,
      );
      ResponseUtil.created(res, vehicle, 'Vehicle registered successfully');
    } catch (err) { next(err); }
  };

  updateVehicle = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id: userId } = req.user!;
      const files = req.files as Express.Multer.File[];
      
      // Upload new files
      const newUrls = await storageService.uploadMultiple(files, 'vehicle', userId);
      
      // Get existing images if any (sent as a string or array)
      let existingImages: string[] = [];
      if (req.body.existingImages) {
        existingImages = Array.isArray(req.body.existingImages) 
          ? req.body.existingImages 
          : [req.body.existingImages];
      }

      const payload = { 
        ...req.body,
        images: [...existingImages, ...newUrls],
        totalSeats: req.body.totalSeats ? parseInt(req.body.totalSeats) : undefined,
        ac: req.body.ac !== undefined ? req.body.ac === 'true' : undefined,
        wifi: req.body.wifi !== undefined ? req.body.wifi === 'true' : undefined,
        music: req.body.music !== undefined ? req.body.music === 'true' : undefined,
        usbCharging: req.body.usbCharging !== undefined ? req.body.usbCharging === 'true' : undefined,
        waterCooler: req.body.waterCooler !== undefined ? req.body.waterCooler === 'true' : undefined,
        blanket: req.body.blanket !== undefined ? req.body.blanket === 'true' : undefined,
        firstAid: req.body.firstAid !== undefined ? req.body.firstAid === 'true' : undefined,
        luggageRack: req.body.luggageRack !== undefined ? req.body.luggageRack === 'true' : undefined,
      };
      
      // Clean up body properties used for logic but not Prisma
      delete (payload as any).existingImages;

      const vehicle = await vehicleService.updateVehicle(req.params.id as string, payload, userId);
      ResponseUtil.success(res, vehicle, 'Vehicle updated');
    } catch (err) { next(err); }
  };

  deleteVehicle = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await vehicleService.deleteVehicle(req.params.id as string, req.user!.id);
      ResponseUtil.noContent(res);
    } catch (err) { next(err); }
  };

  setActive = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vehicle = await vehicleService.setActive(req.params.id as string, req.user!.id);
      ResponseUtil.success(res, vehicle, 'Active vehicle updated');
    } catch (err) { next(err); }
  };
}

export const vehicleController = new VehicleController();
