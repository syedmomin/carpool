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
      ResponseUtil.created(res, booking, 'Booking confirmed');
    } catch (err) { next(err); }
  };

  cancel = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const booking = await bookingService.cancelBooking(req.params.id, req.user!.id);
      ResponseUtil.success(res, booking, 'Booking cancelled');
    } catch (err) { next(err); }
  };

  myBookings = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const bookings = await bookingService.getMyBookings(req.user!.id);
      ResponseUtil.success(res, bookings, `${bookings.length} booking(s) found`);
    } catch (err) { next(err); }
  };
}

export const bookingController = new BookingController();
