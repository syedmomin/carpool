import { Router } from 'express';
import { reviewController } from '../controllers/review.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

// Public: get driver reviews
router.get('/driver/:driverId', reviewController.getDriverReviews);

// Passenger: submit review
router.post('/',
  authenticate,
  authorize('PASSENGER'),
  validate([
    { field: 'driverId', required: true },
    { field: 'rating',   required: true, type: 'number' },
  ]),
  reviewController.submit,
);

// Admin: delete review
router.delete('/:id', authenticate, authorize('ADMIN'), reviewController.deleteReview);

export default router;
