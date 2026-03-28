import { Router } from 'express';
import authRoutes          from './auth.routes';
import userRoutes          from './user.routes';
import rideRoutes          from './ride.routes';
import bookingRoutes       from './booking.routes';
import vehicleRoutes       from './vehicle.routes';
import reviewRoutes        from './review.routes';
import notificationRoutes  from './notification.routes';
import scheduleAlertRoutes from './schedule-alert.routes';
import cnicRoutes          from './cnic.routes';
import earningsRoutes      from './earnings.routes';

const router = Router();

router.use('/auth',            authRoutes);
router.use('/users',           userRoutes);
router.use('/rides',           rideRoutes);
router.use('/bookings',        bookingRoutes);
router.use('/vehicles',        vehicleRoutes);
router.use('/reviews',         reviewRoutes);
router.use('/notifications',   notificationRoutes);
router.use('/schedule-alerts', scheduleAlertRoutes);
router.use('/cnic',            cnicRoutes);
router.use('/earnings',        earningsRoutes);

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV, timestamp: new Date().toISOString() });
});

export default router;
