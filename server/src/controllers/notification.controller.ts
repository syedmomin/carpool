import { Response, NextFunction } from 'express';
import { BaseController } from './base.controller';
import { notificationService } from '../services/notification.service';
import { ResponseUtil } from '../utils/response';
import { AuthRequest, PaginationQuery } from '../types';
import { Notification } from '@prisma/client';

export class NotificationController extends BaseController<Notification, any, any> {
  protected service = notificationService;

  getMine = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await notificationService.getMyNotifications(
        req.user!.id,
        req.query as unknown as PaginationQuery,
      );
      ResponseUtil.paginated(res, result.data, result.meta.total, result.meta.page, result.meta.limit);
    } catch (err) { next(err); }
  };

  markRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const notif = await notificationService.markRead(req.params.id as string, req.user!.id);
      ResponseUtil.success(res, notif, 'Marked as read');
    } catch (err) { next(err); }
  };

  markAllRead = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await notificationService.markAllRead(req.user!.id);
      ResponseUtil.success(res, result, `${result.count} notifications marked as read`);
    } catch (err) { next(err); }
  };

  getUnreadCount = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const count = await notificationService.getUnreadCount(req.user!.id);
      ResponseUtil.success(res, { count });
    } catch (err) { next(err); }
  };

  deleteNotification = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await notificationService.deleteNotification(req.params.id as string, req.user!.id);
      ResponseUtil.noContent(res);
    } catch (err) { next(err); }
  };
}

export const notificationController = new NotificationController();
