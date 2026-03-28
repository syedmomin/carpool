import { Request, Response, NextFunction } from 'express';
import { BaseService } from '../services/base.service';
import { ResponseUtil } from '../utils/response';
import { AuthRequest, PaginationQuery } from '../types';

// ─── Base Controller ──────────────────────────────────────────────────────────
// All controllers extend this. Provides generic CRUD handlers.

export abstract class BaseController<T, CT, UT> {
  protected abstract service: BaseService<T, CT, UT>;

  // ── GET /resource/:id ─────────────────────────────────────────────────────
  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.service.getById(req.params.id);
      ResponseUtil.success(res, data);
    } catch (err) { next(err); }
  };

  // ── GET /resource ─────────────────────────────────────────────────────────
  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as PaginationQuery;
      const result = await this.service.getAll(query);
      ResponseUtil.paginated(res, result.data, result.meta.total, result.meta.page, result.meta.limit);
    } catch (err) { next(err); }
  };

  // ── POST /resource ────────────────────────────────────────────────────────
  create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.service.create(req.body as CT, req.user?.id);
      ResponseUtil.created(res, data);
    } catch (err) { next(err); }
  };

  // ── PUT /resource/:id ─────────────────────────────────────────────────────
  update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.service.update(req.params.id, req.body as UT, req.user?.id);
      ResponseUtil.success(res, data, 'Updated successfully');
    } catch (err) { next(err); }
  };

  // ── DELETE /resource/:id ──────────────────────────────────────────────────
  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.delete(req.params.id);
      ResponseUtil.noContent(res);
    } catch (err) { next(err); }
  };
}
