import { Router } from 'express';
import { bookingController } from '../controllers/booking.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate); // all booking routes require auth

router.post('/',            bookingController.book);
router.get('/mine',         bookingController.myBookings);
router.get('/:id',          bookingController.getById);
router.delete('/:id',       bookingController.cancel);

export default router;
