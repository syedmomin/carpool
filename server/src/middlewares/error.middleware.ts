import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { ResponseUtil } from '../utils/response';

// ─── Global Error Handler ─────────────────────────────────────────────────────
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Known operational error
  if (err instanceof AppError) {
    ResponseUtil.error(res, err.message, err.statusCode, err.errors);
    return;
  }

  // Prisma unique constraint violation
  if ((err as any).code === 'P2002') {
    const field = (err as any).meta?.target?.[0] || 'field';
    ResponseUtil.conflict(res, `${field} already exists`);
    return;
  }

  // Prisma record not found
  if ((err as any).code === 'P2025') {
    ResponseUtil.notFound(res, 'Record not found');
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError')  { ResponseUtil.unauthorized(res, 'Invalid token');  return; }
  if (err.name === 'TokenExpiredError')  { ResponseUtil.unauthorized(res, 'Token expired');  return; }

  // Unknown error — don't leak details in production
  console.error('Unhandled error:', err);
  const message = process.env.NODE_ENV === 'development' ? err.message : 'Internal server error';
  ResponseUtil.error(res, message, 500);
};

// ─── 404 Handler ──────────────────────────────────────────────────────────────
export const notFoundHandler = (_req: Request, res: Response): void => {
  ResponseUtil.notFound(res, `Route ${_req.method} ${_req.originalUrl} not found`);
};
