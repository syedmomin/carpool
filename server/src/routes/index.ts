import { Router } from 'express';
import authRoutes          from './auth.routes';
import userRoutes          from './user.routes';
import rideRoutes          from './ride.routes';
import bookingRoutes       from './booking.routes';
import vehicleRoutes       from './vehicle.routes';
import reviewRoutes        from './review.routes';
import chatRoutes          from './chat.routes';
import notificationRoutes  from './notification.routes';
import scheduleAlertRoutes   from './schedule-alert.routes';
import scheduleRequestRoutes from './schedule-request.routes';
import verificationRoutes  from './verification.routes';
import earningsRoutes      from './earnings.routes';
import uploadRoutes        from './upload.routes';
import trackingRoutes      from './tracking.routes';

const router = Router();

router.use('/auth',            authRoutes);
router.use('/users',           userRoutes);
router.use('/rides',           rideRoutes);
router.use('/bookings',        bookingRoutes);
router.use('/vehicles',        vehicleRoutes);
router.use('/reviews',         reviewRoutes);
router.use('/notifications',   notificationRoutes);
router.use('/schedule-alerts',    scheduleAlertRoutes);
router.use('/schedule-requests',  scheduleRequestRoutes);
router.use('/verification',    verificationRoutes);
router.use('/earnings',        earningsRoutes);
router.use('/upload',          uploadRoutes);
router.use('/tracking',        trackingRoutes);
router.use('/chat',            chatRoutes);

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV, timestamp: new Date().toISOString() });
});

export default router;
