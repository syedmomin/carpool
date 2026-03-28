import { ScheduleAlert } from '@prisma/client';
import prisma from '../data-source';
import { BaseService } from './base.service';
import { AppError } from '../utils/AppError';

type CreateAlertDto = { passengerId: string; fromCity: string; toCity: string; date: string };
type UpdateAlertDto = Partial<CreateAlertDto>;

export class ScheduleAlertService extends BaseService<ScheduleAlert, CreateAlertDto, UpdateAlertDto> {
  protected get model()     { return prisma.scheduleAlert; }
  protected get modelName() { return 'ScheduleAlert'; }

  async getMyAlerts(passengerId: string): Promise<ScheduleAlert[]> {
    return prisma.scheduleAlert.findMany({
      where:   { passengerId },
      orderBy: { date: 'asc' },
    });
  }

  async addAlert(dto: CreateAlertDto, createdBy: string): Promise<ScheduleAlert> {
    if (dto.fromCity.toLowerCase() === dto.toCity.toLowerCase()) {
      throw AppError.badRequest('Departure and destination cannot be the same');
    }

    // No duplicate alerts
    const exists = await prisma.scheduleAlert.findFirst({
      where: {
        passengerId: dto.passengerId,
        fromCity:    { equals: dto.fromCity, mode: 'insensitive' },
        toCity:      { equals: dto.toCity,   mode: 'insensitive' },
        date:        dto.date,
      },
    });
    if (exists) throw AppError.conflict('Alert already set for this route and date');

    return this.create(dto, createdBy);
  }

  async removeAlert(id: string, passengerId: string): Promise<void> {
    const alert = await this.getById(id);
    if ((alert as any).passengerId !== passengerId) throw AppError.forbidden('Not your alert');
    await this.delete(id);
  }
}

export const scheduleAlertService = new ScheduleAlertService();
