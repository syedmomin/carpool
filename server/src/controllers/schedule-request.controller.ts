import { Response, NextFunction } from 'express';
import { scheduleRequestService } from '../services/schedule-request.service';
import { ResponseUtil } from '../utils/response';
import { AuthRequest } from '../types';

export class ScheduleRequestController {

  // POST /schedule-requests  (passenger)
  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { fromCity, toCity, date, departureTime, seats, note } = req.body;
      const result = await scheduleRequestService.createRequest(req.user!.id, { fromCity, toCity, date, departureTime, seats: Number(seats) || 1, note });
      ResponseUtil.created(res, result, 'Schedule request posted');
    } catch (err) { next(err); }
  };

  // GET /schedule-requests  (driver — open requests feed)
  getOpen = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const page  = Number(req.query.page)  || 1;
      const limit = Number(req.query.limit) || 20;
      const city  = req.query.city as string | undefined;
      const result = await scheduleRequestService.getOpenRequests(req.user!.id, page, limit, city);
      ResponseUtil.paginated(res, result.data, result.meta.total, result.meta.page, result.meta.limit);
    } catch (err) { next(err); }
  };

  // GET /schedule-requests/mine  (passenger)
  getMine = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const page  = Number(req.query.page)  || 1;
      const limit = Number(req.query.limit) || 20;
      const result = await scheduleRequestService.getMyRequests(req.user!.id, page, limit);
      ResponseUtil.paginated(res, result.data, result.meta.total, result.meta.page, result.meta.limit);
    } catch (err) { next(err); }
  };

  // POST /schedule-requests/:id/bids  (driver)
  placeBid = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { pricePerSeat, vehicleId, note } = req.body;
      const bid = await scheduleRequestService.placeBid(req.params.id as string, req.user!.id, {
        pricePerSeat: Number(pricePerSeat), vehicleId, note,
      });
      ResponseUtil.created(res, bid, 'Bid placed');
    } catch (err) { next(err); }
  };

  // PATCH /schedule-requests/:id/bids/:bidId/accept  (passenger)
  acceptBid = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const ride = await scheduleRequestService.acceptBid(req.params.id as string, req.params.bidId as string, req.user!.id);
      ResponseUtil.success(res, ride, 'Bid accepted — ride created and booking confirmed');
    } catch (err) { next(err); }
  };

  // PATCH /schedule-requests/:id/bids/:bidId/reject  (passenger)
  rejectBid = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await scheduleRequestService.rejectBid(req.params.id as string, req.params.bidId as string, req.user!.id);
      ResponseUtil.success(res, null, 'Bid rejected');
    } catch (err) { next(err); }
  };

  // DELETE /schedule-requests/:id  (passenger cancel)
  cancelRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await scheduleRequestService.cancelRequest(req.params.id as string, req.user!.id);
      ResponseUtil.success(res, null, 'Request cancelled');
    } catch (err) { next(err); }
  };

  // DELETE /schedule-requests/:id/bids/:bidId  (driver withdraw)
  withdrawBid = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await scheduleRequestService.withdrawBid(req.params.id as string, req.params.bidId as string, req.user!.id);
      ResponseUtil.success(res, null, 'Bid withdrawn');
    } catch (err) { next(err); }
  };
}

export const scheduleRequestController = new ScheduleRequestController();
