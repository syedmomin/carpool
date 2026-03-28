import { Response, NextFunction } from 'express';
import { AuthRequest, UserRole } from '../types';
import { verifyToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';

// ─── Authenticate ─────────────────────────────────────────────────────────────
export const authenticate = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw AppError.unauthorized('No token provided');

    const token = header.split(' ')[1];
    req.user    = verifyToken(token);
    next();
  } catch (err) { next(err); }
};

// ─── Authorize (role-based) ───────────────────────────────────────────────────
export const authorize = (...roles: UserRole[]) =>
  (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(AppError.unauthorized());
    if (!roles.includes(req.user.role as UserRole)) {
      return next(AppError.forbidden('You do not have permission'));
    }
    next();
  };
