import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    private readonly redisService: RedisService,
  ) {}

  async create(createReviewDto: CreateReviewDto, reviewerId: string): Promise<ReviewDocument> {
    const newReview = new this.reviewModel({
      ...createReviewDto,
      reviewerId,
    });
    const savedReview = await newReview.save();

    // Add review to Redis cache
    const review = {
      reviewerId: savedReview.reviewerId,
      rating: savedReview.rating,
      comment: savedReview.comment,
      createdAt: new Date(),
    };
    await this.redisService.addReview(savedReview.propertyId, review);

    // Recalculate and update rating in Redis
    await this.updatePropertyRating(savedReview.propertyId);

    // Invalidate property detail cache
    await this.redisService.del(`property:detail:${savedReview.propertyId}`);

    return savedReview;
  }

  async findByProperty(propertyId: string): Promise<ReviewDocument[]> {
    return this.reviewModel
      .find({ propertyId })
      .populate('reviewerId', 'firstName lastName')
      .exec();
  }

  async findByReviewer(reviewerId: string): Promise<ReviewDocument[]> {
    return this.reviewModel
      .find({ reviewerId })
      .populate('propertyId', 'title address imageUrl')
      .exec();
  }

  async getPropertyRating(
    propertyId: string,
  ): Promise<{ rating: number; count: number; reviews: any[] } | null> {
    const cacheKey = `rating:${propertyId}`;

    try {
      // Try to get from Redis first
      const cachedRating = await this.redisService.getRating(propertyId);
      if (cachedRating) {
        const recentReviews = await this.redisService.getReviews(propertyId);
        return {
          ...cachedRating,
          reviews: recentReviews,
        };
      }
    } catch (error) {
      this.logger.error(`Error getting cached rating for property ${propertyId}:`, error);
    }

    // Calculate from MongoDB
    const stats = await this.reviewModel.aggregate([
      { $match: { propertyId: new (require('mongoose')).Types.ObjectId(propertyId) } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    if (stats.length === 0) {
      return null;
    }

    const { avgRating, count } = stats[0];
    const roundedRating = Math.round(avgRating * 100) / 100;

    // Store in Redis
    try {
      await this.redisService.setRating(propertyId, roundedRating, count);
    } catch (error) {
      this.logger.error(`Error setting rating in Redis for property ${propertyId}:`, error);
    }

    const recentReviews = await this.redisService.getReviews(propertyId);

    return {
      rating: roundedRating,
      count,
      reviews: recentReviews,
    };
  }

  async getRecentReviews(propertyId: string): Promise<any[]> {
    return this.redisService.getReviews(propertyId);
  }

  // Helper method to recalculate and update property rating
  private async updatePropertyRating(propertyId: string): Promise<void> {
    try {
      const ObjectId = require('mongoose').Types.ObjectId;
      const stats = await this.reviewModel.aggregate([
        { $match: { propertyId: new ObjectId(propertyId) } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            count: { $sum: 1 },
          },
        },
      ]);

      if (stats.length > 0) {
        const { avgRating, count } = stats[0];
        const roundedRating = Math.round(avgRating * 100) / 100;
        await this.redisService.setRating(propertyId, roundedRating, count);
      }
    } catch (error) {
      this.logger.error(`Error updating property rating for ${propertyId}:`, error);
    }
  }
}

