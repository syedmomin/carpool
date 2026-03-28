import { Router } from 'express';
import { rideController } from '../controllers/ride.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

router.get('/search', rideController.search);
router.get('/',       rideController.getAll);
router.get('/mine',   authenticate, authorize('DRIVER'), rideController.myRides);
router.get('/:id',    rideController.getById);

router.post('/',
  authenticate,
  authorize('DRIVER'),
  validate([
    { field: 'vehicleId',     required: true },
    { field: 'fromCity',      required: true, min: 2 },
    { field: 'toCity',        required: true, min: 2 },
    { field: 'date',          required: true },
    { field: 'departureTime', required: true },
    { field: 'pricePerSeat',  required: true, type: 'number' },
    { field: 'totalSeats',    required: true, type: 'number' },
  ]),
  rideController.postRide,
);

router.put('/:id',    authenticate, authorize('DRIVER'), rideController.update);
router.delete('/:id', authenticate, authorize('DRIVER', 'ADMIN'), rideController.delete);

export default router;
