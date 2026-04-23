import { Response, NextFunction } from 'express';
import { BaseController } from './base.controller';
import { notificationService } from '../services/notification.service';
import { bookingService } from '../services/booking.service';
import { ResponseUtil } from '../utils/response';
import { AuthRequest, PaginationQuery } from '../types';
import { Notification } from '@prisma/client';
import { AppError } from '../utils/AppError';

export class NotificationController extends BaseController<Notification, any, any> {
  protected service = notificationService;

  // ── Handling Interactive Notification Actions (Background) ────────────────
  handleAction = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { action, bookingId } = req.body;
      const driverId = req.user!.id;

      if (!action || !bookingId) {
        throw AppError.badRequest('Missing action or bookingId');
      }

      console.log(`[NotificationAction] Processing ${action} for booking ${bookingId} by driver ${driverId}`);

      let result;
      if (action === 'ACCEPT') {
        result = await bookingService.acceptBooking(bookingId, driverId);
      } else if (action === 'REJECT') {
        result = await bookingService.rejectBooking(bookingId, driverId);
      } else {
        throw AppError.badRequest('Invalid action');
      }

      ResponseUtil.success(res, result, `Booking successfully ${action === 'ACCEPT' ? 'accepted' : 'rejected'}`);
    } catch (err) { next(err); }
  };

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
