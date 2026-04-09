import { Router } from 'express';
import { reviewController } from '../controllers/review.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

// Public: get user reviews
router.get('/user/:userId', reviewController.getUserReviews);

// Submit review (Both Drivers & Passengers)
router.post('/',
  authenticate,
  authorize('PASSENGER', 'DRIVER'),
  validate([
    { field: 'revieweeId', required: true },
    { field: 'targetRole', required: true },
    { field: 'rating',     required: true, type: 'number' },
  ]),
  reviewController.submit,
);


// Admin: delete review
router.delete('/:id', authenticate, authorize('ADMIN'), reviewController.deleteReview);

export default router;
