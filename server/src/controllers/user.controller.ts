import { Response, NextFunction } from 'express';
import { BaseController } from './base.controller';
import { userService } from '../services/user.service';
import { ResponseUtil } from '../utils/response';
import { AuthRequest, PaginationQuery } from '../types';
import { User } from '@prisma/client';

export class UserController extends BaseController<User, any, any> {
  protected service = userService;

  getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await userService.getProfile(req.user!.id);
      ResponseUtil.success(res, user);
    } catch (err) { next(err); }
  };

  updateMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await userService.updateProfile(req.user!.id, req.body, req.user!.id);
      ResponseUtil.success(res, user, 'Profile updated');
    } catch (err) { next(err); }
  };

  getPublicProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await userService.getPublicProfile(req.params.id as string);
      ResponseUtil.success(res, user);
    } catch (err) { next(err); }
  };

  // Admin only
  getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await userService.getAllUsers(req.query as unknown as PaginationQuery);
      ResponseUtil.paginated(res, result.data, result.meta.total, result.meta.page, result.meta.limit);
    } catch (err) { next(err); }
  };

  deactivateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await userService.deactivateUser(req.params.id as string, req.user!.id);
      ResponseUtil.success(res, null, 'User deactivated');
    } catch (err) { next(err); }
  };
}

export const userController = new UserController();
