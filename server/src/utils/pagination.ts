import { PaginationQuery } from '../types';

export interface PrismaPage {
  skip: number;
  take: number;
  orderBy: Record<string, 'asc' | 'desc'>;
}

export function parsePagination(
  query: PaginationQuery,
  defaultSortBy = 'createdAt',
): PrismaPage {
  const page      = Math.max(1, Number(query.page)  || 1);
  const limit     = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const sortBy    = query.sortBy    || defaultSortBy;
  const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';

  return {
    skip:    (page - 1) * limit,
    take:    limit,
    orderBy: { [sortBy]: sortOrder },
  };
}
