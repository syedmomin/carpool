import { Router, Response, NextFunction } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { AuthRequest } from '../types';
import prisma from '../data-source';
import { ResponseUtil } from '../utils/response';

const router = Router();

// Authenticated user
router.get('/me',     authenticate, userController.getMe);
router.put('/me',
  authenticate,
  validate([
    { field: 'name',  min: 2, max: 60 },
    { field: 'phone', min: 10 },
    { field: 'city',  max: 60 },
  ]),
  userController.updateMe,
);

// FCM token update (called on app start after login)
router.put('/me/fcm-token',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { fcmToken } = req.body;
      if (!fcmToken) { ResponseUtil.badRequest(res, 'fcmToken is required'); return; }
      await prisma.user.update({ where: { id: req.user!.id }, data: { fcmToken } });
      ResponseUtil.success(res, null, 'FCM token updated');
    } catch (err) { next(err); }
  },
);

// Public profile
router.get('/:id', userController.getPublicProfile);

// Admin only
router.get('/',        authenticate, authorize('ADMIN'), userController.getAllUsers);
router.delete('/:id',  authenticate, authorize('ADMIN'), userController.deactivateUser);

export default router;
