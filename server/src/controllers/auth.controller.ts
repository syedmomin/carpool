import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { ResponseUtil } from '../utils/response';
import { AuthRequest } from '../types';
import prisma from '../data-source';

export class AuthController {
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.register(req.body);
      ResponseUtil.created(res, result, 'Account created successfully');
    } catch (err) { next(err); }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.login(req.body);
      ResponseUtil.success(res, result, 'Login successful');
    } catch (err) { next(err); }
  };

  changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.user!.id, currentPassword, newPassword);
      ResponseUtil.success(res, null, 'Password changed successfully');
    } catch (err) { next(err); }
  };

  me = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true, name: true, email: true, phone: true, role: true,
          avatar: true, city: true, isVerified: true,
          fcmToken: true, isActive: true, createdAt: true, updatedAt: true,
          verification: {
            select: { cnicNumber: true, cnicStatus: true, licenceStatus: true },
          },
        },
      });
      if (!user) { ResponseUtil.success(res, req.user, 'Profile fetched'); return; }
      ResponseUtil.success(res, user, 'Profile fetched');
    } catch (err) { next(err); }
  };
}

export const authController = new AuthController();
