import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
export declare class ReviewsController {
    private readonly reviewsService;
    constructor(reviewsService: ReviewsService);
    create(createReviewDto: CreateReviewDto, req: any): Promise<import("./schemas/review.schema").ReviewDocument>;
    findMine(req: any): Promise<import("./schemas/review.schema").ReviewDocument[]>;
    findByProperty(propertyId: string): Promise<import("./schemas/review.schema").ReviewDocument[]>;
}
