import { Request } from 'express';

// ─── Authenticated Request ───────────────────────────────────────────────────
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

// ─── Pagination ──────────────────────────────────────────────────────────────
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ─── JWT Payload ─────────────────────────────────────────────────────────────
export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  tv?: number; // tokenVersion — used to invalidate refresh tokens
  iat?: number;
  exp?: number;
}

// ─── User Role (mirrors Prisma enum) ─────────────────────────────────────────
export type UserRole = 'PASSENGER' | 'DRIVER' | 'ADMIN';
