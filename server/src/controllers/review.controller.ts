import { Request, Response, NextFunction } from 'express';
import { BaseController } from './base.controller';
import { reviewService } from '../services/review.service';
import { ResponseUtil } from '../utils/response';
import { AuthRequest } from '../types';
import { Review } from '@prisma/client';

export class ReviewController extends BaseController<Review, any, any> {
  protected service = reviewService;

  getUserReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await reviewService.getUserReviews(req.params.userId as string);
      ResponseUtil.success(res, data);
    } catch (err) { next(err); }
  };


  submit = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const review = await reviewService.submitReview(
        { ...req.body, reviewerId: req.user!.id },
        req.user!.id,
      );
      ResponseUtil.created(res, review, 'Review submitted');
    } catch (err) { next(err); }
  };

  deleteReview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await reviewService.delete(req.params.id as string);
      ResponseUtil.noContent(res);
    } catch (err) { next(err); }
  };
}

export const reviewController = new ReviewController();
