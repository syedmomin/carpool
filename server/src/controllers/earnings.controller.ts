import { Response, NextFunction } from 'express';
import { earningsService } from '../services/earnings.service';
import { ResponseUtil } from '../utils/response';
import { AuthRequest } from '../types';

export class EarningsController {
  get = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const period = (req.query.period as any) || 'all';
      const data   = await earningsService.getDriverEarnings(req.user!.id, period);
      ResponseUtil.success(res, data, 'Earnings fetched');
    } catch (err) { next(err); }
  };
}

export const earningsController = new EarningsController();
