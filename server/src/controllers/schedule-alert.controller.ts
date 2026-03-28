import { Response, NextFunction } from 'express';
import { BaseController } from './base.controller';
import { scheduleAlertService } from '../services/schedule-alert.service';
import { ResponseUtil } from '../utils/response';
import { AuthRequest } from '../types';
import { ScheduleAlert } from '@prisma/client';

export class ScheduleAlertController extends BaseController<ScheduleAlert, any, any> {
  protected service = scheduleAlertService;

  getMine = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const alerts = await scheduleAlertService.getMyAlerts(req.user!.id);
      ResponseUtil.success(res, alerts, `${alerts.length} alert(s) found`);
    } catch (err) { next(err); }
  };

  add = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const alert = await scheduleAlertService.addAlert(
        { ...req.body, passengerId: req.user!.id },
        req.user!.id,
      );
      ResponseUtil.created(res, alert, 'Ride alert set successfully');
    } catch (err) { next(err); }
  };

  remove = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await scheduleAlertService.removeAlert(req.params.id, req.user!.id);
      ResponseUtil.noContent(res);
    } catch (err) { next(err); }
  };
}

export const scheduleAlertController = new ScheduleAlertController();
