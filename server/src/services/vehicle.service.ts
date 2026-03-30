import { Vehicle, VehicleType } from '@prisma/client';
import prisma from '../data-source';
import { BaseService } from './base.service';
import { AppError } from '../utils/AppError';

type CreateVehicleDto = {
  driverId: string; type: string; brand: string; model?: string;
  color?: string; plateNumber: string; totalSeats: number;
  ac?: boolean; wifi?: boolean; music?: boolean; usbCharging?: boolean;
  waterCooler?: boolean; blanket?: boolean; firstAid?: boolean; luggageRack?: boolean;
  images?: string[];
};
type UpdateVehicleDto = Partial<Omit<CreateVehicleDto, 'driverId' | 'plateNumber'>>;

export class VehicleService extends BaseService<Vehicle, CreateVehicleDto, UpdateVehicleDto> {
  protected get model()     { return prisma.vehicle; }
  protected get modelName() { return 'Vehicle'; }

  async getMyVehicles(driverId: string): Promise<Vehicle[]> {
    return prisma.vehicle.findMany({
      where:   { driverId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async registerVehicle(dto: CreateVehicleDto, createdBy: string): Promise<Vehicle> {
    // Plate number uniqueness
    const exists = await prisma.vehicle.findUnique({ where: { plateNumber: dto.plateNumber } });
    if (exists) throw AppError.conflict('A vehicle with this plate number already exists');

    // First vehicle auto-active
    const count = await prisma.vehicle.count({ where: { driverId: dto.driverId } });

    return prisma.vehicle.create({
      data: { ...dto, type: dto.type as VehicleType, isActive: count === 0, createdBy, updatedBy: createdBy },
    });
  }

  private ownsVehicle(vehicle: any, driverId: string): boolean {
    return vehicle.driverId === driverId || vehicle.createdBy === driverId;
  }

  async updateVehicle(id: string, dto: UpdateVehicleDto, driverId: string): Promise<Vehicle> {
    const vehicle = await this.getById(id);
    if (!this.ownsVehicle(vehicle, driverId)) throw AppError.forbidden('Not your vehicle');
    return this.update(id, dto, driverId);
  }

  async deleteVehicle(id: string, driverId: string): Promise<void> {
    const vehicle = await this.getById(id);
    if (!this.ownsVehicle(vehicle, driverId)) throw AppError.forbidden('Not your vehicle');

    // Block deletion if vehicle has active rides
    const activeRideCount = await prisma.ride.count({
      where: { vehicleId: id, status: { in: ['ACTIVE', 'IN_PROGRESS'] as any } },
    });
    if (activeRideCount > 0) {
      throw AppError.conflict('Cannot delete vehicle with active rides. Cancel or complete those rides first.');
    }

    // If active vehicle deleted, activate another
    if ((vehicle as any).isActive) {
      const another = await prisma.vehicle.findFirst({
        where: { driverId, id: { not: id } },
      });
      if (another) {
        await prisma.vehicle.update({ where: { id: another.id }, data: { isActive: true } });
      }
    }
    await this.delete(id);
  }

  async setActive(vehicleId: string, driverId: string): Promise<Vehicle> {
    const vehicle = await this.getById(vehicleId);
    if ((vehicle as any).driverId !== driverId) throw AppError.forbidden('Not your vehicle');

    // Deactivate all driver's vehicles then activate selected
    await prisma.vehicle.updateMany({
      where: { driverId },
      data:  { isActive: false },
    });
    return prisma.vehicle.update({
      where: { id: vehicleId },
      data:  { isActive: true, updatedBy: driverId },
    });
  }
}

export const vehicleService = new VehicleService();
