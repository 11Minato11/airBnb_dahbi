import { Model } from 'mongoose';
import { ReviewDocument } from './schemas/review.schema';
import { CreateReviewDto } from './dto/create-review.dto';
export declare class ReviewsService {
    private reviewModel;
    constructor(reviewModel: Model<ReviewDocument>);
    create(createReviewDto: CreateReviewDto, reviewerId: string): Promise<ReviewDocument>;
    findByProperty(propertyId: string): Promise<ReviewDocument[]>;
    findByReviewer(reviewerId: string): Promise<ReviewDocument[]>;
}
