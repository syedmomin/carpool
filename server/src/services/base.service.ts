import { PrismaClient } from '@prisma/client';
import prisma from '../data-source';
import { PaginationQuery, PaginatedResult } from '../types';
import { parsePagination } from '../utils/pagination';
import { AppError } from '../utils/AppError';

// ─── Base Service ─────────────────────────────────────────────────────────────
// All services extend this. Provides generic CRUD with pagination.
// T  = Prisma model type (e.g. User, Ride)
// CT = Create input type
// UT = Update input type

export abstract class BaseService<T, CT, UT> {
  protected prisma: PrismaClient = prisma;

  // The Prisma delegate — set by child: e.g. this.prisma.user
  protected abstract get model(): any;

  // Name for error messages — set by child: e.g. 'User'
  protected abstract get modelName(): string;

  // ── Get by ID ──────────────────────────────────────────────────────────────
  async getById(id: string, include?: object): Promise<T> {
    const record = await this.model.findUnique({ where: { id }, include });
    if (!record) throw AppError.notFound(`${this.modelName} not found`);
    return record as T;
  }

  // ── Get All (paginated) ────────────────────────────────────────────────────
  async getAll(
    query: PaginationQuery,
    where?: object,
    include?: object,
    defaultSortBy?: string,
  ): Promise<PaginatedResult<T>> {
    const { skip, take, orderBy } = parsePagination(query, defaultSortBy);

    const [data, total] = await Promise.all([
      this.model.findMany({ where, include, skip, take, orderBy }),
      this.model.count({ where }),
    ]);

    const page  = Number(query.page)  || 1;
    const limit = Number(query.limit) || 10;

    return {
      data: data as T[],
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext:    page < Math.ceil(total / limit),
        hasPrev:    page > 1,
      },
    };
  }

  // ── Create ─────────────────────────────────────────────────────────────────
  async create(data: CT, createdBy?: string): Promise<T> {
    return this.model.create({
      data: { ...data, ...(createdBy ? { createdBy, updatedBy: createdBy } : {}) },
    }) as Promise<T>;
  }

  // ── Update ─────────────────────────────────────────────────────────────────
  async update(id: string, data: UT, updatedBy?: string): Promise<T> {
    await this.getById(id); // throws 404 if not found
    return this.model.update({
      where: { id },
      data:  { ...data, ...(updatedBy ? { updatedBy } : {}) },
    }) as Promise<T>;
  }

  // ── Delete (hard) ──────────────────────────────────────────────────────────
  async delete(id: string): Promise<void> {
    await this.getById(id); // throws 404 if not found
    await this.model.delete({ where: { id } });
  }

  // ── Soft Delete (sets isActive = false) ───────────────────────────────────
  async softDelete(id: string, updatedBy?: string): Promise<T> {
    await this.getById(id);
    return this.model.update({
      where: { id },
      data:  { isActive: false, ...(updatedBy ? { updatedBy } : {}) },
    }) as Promise<T>;
  }

  // ── Count ─────────────────────────────────────────────────────────────────
  async count(where?: object): Promise<number> {
    return this.model.count({ where });
  }

  // ── Exists ────────────────────────────────────────────────────────────────
  async exists(where: object): Promise<boolean> {
    const record = await this.model.findFirst({ where, select: { id: true } });
    return !!record;
  }
}
