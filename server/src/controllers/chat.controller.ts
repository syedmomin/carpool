import { Request, Response, NextFunction } from 'express';
import { chatService } from '../services/chat.service';
import { ResponseUtil } from '../utils/ResponseUtil';
import { AuthRequest } from '../middlewares/auth.middleware';

export class ChatController {
  /**
   * Get chat history for a booking
   */
  getHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { bookingId } = req.params;
      const messages = await chatService.getMessages(bookingId);
      ResponseUtil.success(res, messages);
    } catch (err) {
      next(err);
    }
  };
}

export const chatController = new ChatController();
