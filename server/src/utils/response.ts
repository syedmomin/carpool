import { Response } from 'express';
import { FieldError } from './AppError';

// ─── Pagination Meta ──────────────────────────────────────────────────────────
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ─── Standard API Response Shape ─────────────────────────────────────────────
export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data: T | null;
  errors: FieldError[] | null;
  meta: PaginationMeta | null;
  timestamp: string;
}

// ─── Response Builder ─────────────────────────────────────────────────────────
export class ResponseUtil {
  static success<T>(
    res: Response,
    data: T,
    message = 'Success',
    statusCode = 200,
    meta?: PaginationMeta,
  ): Response {
    const body: ApiResponse<T> = {
      success:   true,
      message,
      data,
      errors:    null,
      meta:      meta ?? null,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(body);
  }

  static created<T>(res: Response, data: T, message = 'Created successfully'): Response {
    return this.success(res, data, message, 201);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  static error(
    res: Response,
    message = 'Something went wrong',
    statusCode = 500,
    errors?: FieldError[],
  ): Response {
    const body: ApiResponse<null> = {
      success:   false,
      message,
      data:      null,
      errors:    errors ?? null,
      meta:      null,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(body);
  }

  static badRequest(res: Response, message = 'Bad request', errors?: FieldError[]): Response {
    return this.error(res, message, 400, errors);
  }

  static unauthorized(res: Response, message = 'Unauthorized'): Response {
    return this.error(res, message, 401);
  }

  static forbidden(res: Response, message = 'Forbidden'): Response {
    return this.error(res, message, 403);
  }

  static notFound(res: Response, message = 'Resource not found'): Response {
    return this.error(res, message, 404);
  }

  static conflict(res: Response, message = 'Conflict'): Response {
    return this.error(res, message, 409);
  }

  static paginated<T>(
    res: Response,
    data: T[],
    total: number,
    page: number,
    limit: number,
    message = 'Success',
  ): Response {
    const totalPages = Math.ceil(total / limit);
    const meta: PaginationMeta = {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
    return this.success(res, data, message, 200, meta);
  }
}
