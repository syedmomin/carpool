import { Router } from 'express';
import { trackingController } from '../controllers/tracking.controller';
// import { protect } from '../middlewares/auth.middleware'; // if needed later

const router = Router();

router.get('/route/:rideId', trackingController.getRoute);
router.get('/location/:rideId', trackingController.getLatestLocation);
router.post('/update-location', trackingController.updateLocation);

export default router;
