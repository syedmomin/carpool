import { Review } from '@prisma/client';
import prisma from '../data-source';
import { BaseService } from './base.service';
import { AppError } from '../utils/AppError';

type CreateReviewDto = { driverId: string; reviewerId: string; rating: number; comment?: string };
type UpdateReviewDto = { rating?: number; comment?: string };

export class ReviewService extends BaseService<Review, CreateReviewDto, UpdateReviewDto> {
  protected get model()     { return prisma.review; }
  protected get modelName() { return 'Review'; }

  async getDriverReviews(driverId: string) {
    const reviews = await prisma.review.findMany({
      where:   { driverId },
      include: { reviewer: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const avg = reviews.length
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

    return {
      reviews,
      stats: {
        total:         reviews.length,
        averageRating: Math.round(avg * 10) / 10,
        breakdown: [5, 4, 3, 2, 1].map(star => ({
          star,
          count: reviews.filter(r => r.rating === star).length,
        })),
      },
    };
  }

  async submitReview(dto: CreateReviewDto, createdBy: string): Promise<Review> {
    if (dto.rating < 1 || dto.rating > 5) {
      throw AppError.badRequest('Rating must be between 1 and 5');
    }

    // Reviewer must have completed a booking with this driver
    const hasRidden = await prisma.booking.findFirst({
      where: {
        passengerId: dto.reviewerId,
        status:      'COMPLETED',
        ride:        { driverId: dto.driverId },
      },
    });
    if (!hasRidden) throw AppError.forbidden('You can only review drivers you have ridden with');

    // One review per passenger per driver
    const existing = await prisma.review.findFirst({
      where: { driverId: dto.driverId, reviewerId: dto.reviewerId },
    });
    if (existing) {
      return this.update(existing.id, { rating: dto.rating, comment: dto.comment }, createdBy);
    }

    return this.create(dto, createdBy);
  }
}

export const reviewService = new ReviewService();
