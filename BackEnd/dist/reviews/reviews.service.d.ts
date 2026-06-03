import { Model } from 'mongoose';
import { ReviewDocument } from './schemas/review.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { RedisService } from '../redis/redis.service';
export declare class ReviewsService {
    private reviewModel;
    private readonly redisService;
    private readonly logger;
    constructor(reviewModel: Model<ReviewDocument>, redisService: RedisService);
    create(createReviewDto: CreateReviewDto, reviewerId: string): Promise<ReviewDocument>;
    findByProperty(propertyId: string): Promise<ReviewDocument[]>;
    findByReviewer(reviewerId: string): Promise<ReviewDocument[]>;
    getPropertyRating(propertyId: string): Promise<{
        rating: number;
        count: number;
        reviews: any[];
    } | null>;
    getRecentReviews(propertyId: string): Promise<any[]>;
    private updatePropertyRating;
}
