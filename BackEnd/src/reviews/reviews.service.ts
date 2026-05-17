import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(@InjectModel(Review.name) private reviewModel: Model<ReviewDocument>) {}

  async create(createReviewDto: CreateReviewDto, reviewerId: string): Promise<ReviewDocument> {
    const newReview = new this.reviewModel({
      ...createReviewDto,
      reviewerId,
    });
    return newReview.save();
  }

  async findByProperty(propertyId: string): Promise<ReviewDocument[]> {
    return this.reviewModel.find({ propertyId }).populate('reviewerId', 'firstName lastName').exec();
  }

  async findByReviewer(reviewerId: string): Promise<ReviewDocument[]> {
    return this.reviewModel.find({ reviewerId }).populate('propertyId', 'title address imageUrl').exec();
  }
}
