import { Response, NextFunction } from 'express';
import { BaseController } from './base.controller';
import { bookingService } from '../services/booking.service';
import { ResponseUtil } from '../utils/response';
import { AuthRequest } from '../types';
import { Booking } from '@prisma/client';

export class BookingController extends BaseController<Booking, any, any> {
  protected service = bookingService;

  book = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { rideId, seats } = req.body;
      const booking = await bookingService.bookRide(rideId, req.user!.id, Number(seats), req.body);
      ResponseUtil.created(res, booking, 'Booking request sent');
    } catch (err) { next(err); }
  };

  accept = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const booking = await bookingService.acceptBooking(req.params.id as string, req.user!.id);
      ResponseUtil.success(res, booking, 'Booking accepted');
    } catch (err) { next(err); }
  };

  reject = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const booking = await bookingService.rejectBooking(req.params.id as string, req.user!.id);
      ResponseUtil.success(res, booking, 'Booking rejected');
    } catch (err) { next(err); }
  };

  cancel = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reason } = req.body;
      const booking = await bookingService.cancelBooking(req.params.id as string, req.user!.id, reason);
      ResponseUtil.success(res, booking, 'Booking cancelled');
    } catch (err) { next(err); }
  };

  myBookings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page  = Number(req.query.page)  || 1;
      const limit = Number(req.query.limit) || 10;
      const result = await bookingService.getMyBookings(req.user!.id, page, limit);
      ResponseUtil.success(res, result, `${result.meta.total} booking(s) found`);
    } catch (err) { next(err); }
  };
}

export const bookingController = new BookingController();
