import { Router } from 'express';
import { scheduleRequestController } from '../controllers/schedule-request.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Passenger routes
router.post('/',        authenticate, authorize('PASSENGER'), scheduleRequestController.create);
router.get('/mine',     authenticate, authorize('PASSENGER'), scheduleRequestController.getMine);
router.delete('/:id',  authenticate, authorize('PASSENGER'), scheduleRequestController.cancelRequest);
router.patch('/:id/bids/:bidId/accept', authenticate, authorize('PASSENGER'), scheduleRequestController.acceptBid);
router.patch('/:id/bids/:bidId/reject', authenticate, authorize('PASSENGER'), scheduleRequestController.rejectBid);

// Driver routes
router.get('/match-count',               authenticate, authorize('DRIVER'),    scheduleRequestController.getMatchCount);
router.get('/',                         authenticate, authorize('DRIVER'),    scheduleRequestController.getOpen);
router.post('/:id/bids',               authenticate, authorize('DRIVER'),    scheduleRequestController.placeBid);
router.delete('/:id/bids/:bidId',      authenticate, authorize('DRIVER'),    scheduleRequestController.withdrawBid);

export default router;
