import { Router } from 'express';
import { trackingController } from '../controllers/tracking.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/route/:rideId',    authenticate, trackingController.getRoute);
router.get('/location/:rideId', authenticate, trackingController.getLatestLocation);
router.post('/update-location', authenticate, authorize('DRIVER'), trackingController.updateLocation);

export default router;
