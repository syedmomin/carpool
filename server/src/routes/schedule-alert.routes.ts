import { Router } from 'express';
import { scheduleAlertController } from '../controllers/schedule-alert.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

router.use(authenticate, authorize('PASSENGER'));

router.get('/',     scheduleAlertController.getMine);
router.post('/',
  validate([
    { field: 'fromCity', required: true },
    { field: 'toCity',   required: true },
    { field: 'date',     required: true },
  ]),
  scheduleAlertController.add,
);
router.delete('/:id', scheduleAlertController.remove);

export default router;
