import { Request, Response, NextFunction } from 'express';
import { chatService } from '../services/chat.service';
import { ResponseUtil } from '../utils/response';
import { AuthRequest } from '../types';

export class ChatController {
  /**
   * Get chat history for a booking
   */
  getHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { bookingId } = req.params;
      const messages = await chatService.getMessages(bookingId as string);
      ResponseUtil.success(res, messages);
    } catch (err) {
      next(err);
    }
  };
}

export const chatController = new ChatController();
