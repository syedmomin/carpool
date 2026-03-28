import { Router } from 'express';
import { bookingController } from '../controllers/booking.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

router.use(authenticate);

router.post('/',
  validate([
    { field: 'rideId', required: true },
    { field: 'seats',  required: true, type: 'number' },
  ]),
  bookingController.book,
);
router.get('/mine',   bookingController.myBookings);
router.get('/:id',    bookingController.getById);
router.delete('/:id', bookingController.cancel);

export default router;
