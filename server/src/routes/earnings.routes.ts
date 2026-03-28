import { Router } from 'express';
import { earningsController } from '../controllers/earnings.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// GET /api/v1/earnings?period=all|month|week
router.get('/', authenticate, authorize('DRIVER'), earningsController.get);

export default router;
