import { Router } from 'express';
import { rideController } from '../controllers/ride.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Public
router.get('/search', rideController.search);
router.get('/:id',    rideController.getById);
router.get('/',       rideController.getAll);

// Driver only
router.post('/',        authenticate, authorize('DRIVER'), rideController.postRide);
router.get('/mine',     authenticate, authorize('DRIVER'), rideController.myRides);
router.put('/:id',      authenticate, authorize('DRIVER'), rideController.update);
router.delete('/:id',   authenticate, authorize('DRIVER', 'ADMIN'), rideController.delete);

export default router;
