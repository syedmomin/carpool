import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/',                 notificationController.getMine);
router.get('/unread-count',     notificationController.getUnreadCount);
router.put('/read-all',         notificationController.markAllRead);
router.put('/:id/read',         notificationController.markRead);
router.post('/action',          notificationController.handleAction);
router.delete('/:id',           notificationController.deleteNotification);

export default router;
