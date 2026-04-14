import { Review, UserRole } from '@prisma/client';
import prisma from '../data-source';
import { BaseService } from './base.service';
import { AppError } from '../utils/AppError';
import { notify } from '../utils/notificationDispatcher';

type CreateReviewDto = { 
  revieweeId: string; 
  reviewerId: string; 
  rideId?: string;
  targetRole: UserRole;
  rating: number; 
  comment?: string 
};
type UpdateReviewDto = { rating?: number; comment?: string };

export class ReviewService extends BaseService<Review, CreateReviewDto, UpdateReviewDto> {
  protected get model()     { return prisma.review; }
  protected get modelName() { return 'Review'; }

  async getUserReviews(userId: string) {
    const reviews = await prisma.review.findMany({
      where:   { revieweeId: userId },
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

    // Verify a legitimate ride relationship exists
    if (dto.targetRole === 'DRIVER') {
      // Reviewer (Passenger) must have completed a booking with this driver
      const hasRidden = await prisma.booking.findFirst({
        where: {
          passengerId: dto.reviewerId,
          status:      'COMPLETED',
          ride:        { driverId: dto.revieweeId },
        },
      });
      if (!hasRidden) throw AppError.forbidden('You can only review drivers you have ridden with');
    } else {
      // Reviewer (Driver) must have completed a ride with this passenger
      const hasDriven = await prisma.booking.findFirst({
        where: {
          passengerId: dto.revieweeId,
          status:      'COMPLETED',
          ride:        { driverId: dto.reviewerId },
        },
      });
      if (!hasDriven) throw AppError.forbidden('You can only review passengers who have ridden with you');
    }

    // One review per pair per ride (or generally per pair if rideId is null)
    const existing = await prisma.review.findFirst({
      where: { 
        revieweeId: dto.revieweeId, 
        reviewerId: dto.reviewerId,
        ...(dto.rideId ? { rideId: dto.rideId } : {})
      },
    });

    if (existing) {
      throw AppError.conflict('You have already reviewed this person for this ride');
    }

    const review = await this.create(dto, createdBy);

    // Notify the person who received the review
    const stars = '⭐'.repeat(dto.rating);
    const role  = dto.targetRole === 'DRIVER' ? 'driver' : 'passenger';
    notify({
      userId:      dto.revieweeId,
      title:       `New Review Received! ${stars}`,
      message:     dto.comment
        ? `You received a ${dto.rating}-star review as a ${role}: "${dto.comment}"`
        : `You received a ${dto.rating}-star review as a ${role}.`,
      type:        'SYSTEM',
      rideId:      dto.rideId,
      socketEvent: 'REVIEW_RECEIVED',
      socketData:  { rating: dto.rating, targetRole: dto.targetRole },
    });

    return review;
  }
}

export const reviewService = new ReviewService();

