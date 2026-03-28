import { Router } from 'express';
import { cnicController } from '../controllers/cnic.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

// Driver: submit & check status
router.post('/',
  authenticate,
  authorize('DRIVER'),
  validate([{ field: 'cnicNumber', required: true, min: 13, max: 15 }]),
  cnicController.submit,
);
router.get('/status', authenticate, cnicController.getMyStatus);

// Admin: list pending & review
router.get('/pending',      authenticate, authorize('ADMIN'), cnicController.getPending);
router.put('/:id/review',
  authenticate,
  authorize('ADMIN'),
  validate([{ field: 'status', required: true }]),
  cnicController.review,
);

export default router;
