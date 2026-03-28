import { Router } from 'express';
import { rideController } from '../controllers/ride.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Public
router.get('/search', rideController.search);
router.get('/',       rideController.getAll);

// Driver only — /mine MUST come before /:id
router.get('/mine',   authenticate, authorize('DRIVER'), rideController.myRides);
router.get('/:id',    rideController.getById);

router.post('/',      authenticate, authorize('DRIVER'), rideController.postRide);
router.put('/:id',    authenticate, authorize('DRIVER'), rideController.update);
router.delete('/:id', authenticate, authorize('DRIVER', 'ADMIN'), rideController.delete);

export default router;
