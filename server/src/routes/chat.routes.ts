import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Get chat history (Protected)
router.get('/:bookingId', authenticate, chatController.getHistory);

export default router;
