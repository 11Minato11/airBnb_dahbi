"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ReviewsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const review_schema_1 = require("./schemas/review.schema");
const redis_service_1 = require("../redis/redis.service");
let ReviewsService = ReviewsService_1 = class ReviewsService {
    reviewModel;
    redisService;
    logger = new common_1.Logger(ReviewsService_1.name);
    constructor(reviewModel, redisService) {
        this.reviewModel = reviewModel;
        this.redisService = redisService;
    }
    async create(createReviewDto, reviewerId) {
        const newReview = new this.reviewModel({
            ...createReviewDto,
            reviewerId,
        });
        const savedReview = await newReview.save();
        const review = {
            reviewerId: savedReview.reviewerId,
            rating: savedReview.rating,
            comment: savedReview.comment,
            createdAt: new Date(),
        };
        await this.redisService.addReview(savedReview.propertyId, review);
        await this.updatePropertyRating(savedReview.propertyId);
        await this.redisService.del(`property:detail:${savedReview.propertyId}`);
        return savedReview;
    }
    async findByProperty(propertyId) {
        return this.reviewModel
            .find({ propertyId })
            .populate('reviewerId', 'firstName lastName')
            .exec();
    }
    async findByReviewer(reviewerId) {
        return this.reviewModel
            .find({ reviewerId })
            .populate('propertyId', 'title address imageUrl')
            .exec();
    }
    async getPropertyRating(propertyId) {
        const cacheKey = `rating:${propertyId}`;
        try {
            const cachedRating = await this.redisService.getRating(propertyId);
            if (cachedRating) {
                const recentReviews = await this.redisService.getReviews(propertyId);
                return {
                    ...cachedRating,
                    reviews: recentReviews,
                };
            }
        }
        catch (error) {
            this.logger.error(`Error getting cached rating for property ${propertyId}:`, error);
        }
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
        try {
            await this.redisService.setRating(propertyId, roundedRating, count);
        }
        catch (error) {
            this.logger.error(`Error setting rating in Redis for property ${propertyId}:`, error);
        }
        const recentReviews = await this.redisService.getReviews(propertyId);
        return {
            rating: roundedRating,
            count,
            reviews: recentReviews,
        };
    }
    async getRecentReviews(propertyId) {
        return this.redisService.getReviews(propertyId);
    }
    async updatePropertyRating(propertyId) {
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
        }
        catch (error) {
            this.logger.error(`Error updating property rating for ${propertyId}:`, error);
        }
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = ReviewsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(review_schema_1.Review.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        redis_service_1.RedisService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map