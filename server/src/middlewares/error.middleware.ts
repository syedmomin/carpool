import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { ResponseUtil } from '../utils/response';
import { logger } from '../utils/logger';

// ─── Global Error Handler ─────────────────────────────────────────────────────
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Log every error to error.log
  logger.logError(err, _req);

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
  if (err.name === 'JsonWebTokenError') { ResponseUtil.unauthorized(res, 'Invalid token'); return; }
  if (err.name === 'TokenExpiredError') { ResponseUtil.unauthorized(res, 'Token expired');  return; }

  // Multer errors (file upload validation)
  if (err.name === 'MulterError') {
    const multerErr = err as any;
    if (multerErr.code === 'LIMIT_FILE_SIZE') {
      ResponseUtil.badRequest(res, 'File too large. Maximum size is 10MB');
    } else {
      ResponseUtil.badRequest(res, multerErr.message || 'File upload error');
    }
    return;
  }
  if ((err as any).status === 400 && err.message?.includes('image')) {
    ResponseUtil.badRequest(res, err.message);
    return;
  }

  // Database / TLS connection errors — never leak internals
  const msg = err.message || '';
  if (
    msg.includes('TLS') ||
    msg.includes('self-signed') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('certificate') ||
    msg.includes('connect ETIMEDOUT') ||
    (err as any).code === 'P1001' ||
    (err as any).code === 'P1017'
  ) {
    console.error('[DB] Connection error:', msg);
    ResponseUtil.error(res, 'Service temporarily unavailable. Please try again.', 503);
    return;
  }

  // Unknown error — always hide internals
  console.error('[Unhandled]', err);
  ResponseUtil.error(res, 'Something went wrong. Please try again.', 500);
};

// ─── 404 Handler ──────────────────────────────────────────────────────────────
export const notFoundHandler = (_req: Request, res: Response): void => {
  ResponseUtil.notFound(res, `Route ${_req.method} ${_req.originalUrl} not found`);
};
