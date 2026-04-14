import { Router } from 'express';
import { bookingController } from '../controllers/booking.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

router.use(authenticate);

router.post('/',
  validate([
    { field: 'rideId', required: true },
    { field: 'seats',  required: true, type: 'number', min: 1, max: 10 },
  ]),
  bookingController.book,
);
router.get('/mine',   bookingController.myBookings);
router.get('/:id',    bookingController.getById);
router.post('/accept/:id', bookingController.accept);
router.post('/reject/:id', bookingController.reject);
router.delete('/:id', bookingController.cancel);

export default router;
