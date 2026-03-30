import { Response, NextFunction } from 'express';
import { BaseController } from './base.controller';
import { cnicService } from '../services/cnic.service';
import { ResponseUtil } from '../utils/response';
import { AuthRequest } from '../types';
import { UserVerification } from '@prisma/client';

export class CnicController extends BaseController<UserVerification, any, any> {
  protected service = cnicService;

  submit = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const record = await cnicService.submitVerification(
        { ...req.body, userId: req.user!.id },
        req.user!.id,
      );
      ResponseUtil.created(res, record, 'Verification submitted. Under review.');
    } catch (err) { next(err); }
  };

  getMyStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = await cnicService.getMyStatus(req.user!.id);
      ResponseUtil.success(res, status ?? { status: 'NOT_SUBMITTED' });
    } catch (err) { next(err); }
  };

  // Admin only
  getPending = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const list = await cnicService.getPending();
      ResponseUtil.success(res, list, `${list.length} pending verification(s)`);
    } catch (err) { next(err); }
  };

  review = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, rejectedReason } = req.body;
      const record = await cnicService.review(req.params.id as string, status, req.user!.id, rejectedReason);
      ResponseUtil.success(res, record, `Verification ${status.toLowerCase()}`);
    } catch (err) { next(err); }
  };
}

export const cnicController = new CnicController();
