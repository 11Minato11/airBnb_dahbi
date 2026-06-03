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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserLikesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_like_schema_1 = require("./schemas/user-like.schema");
let UserLikesService = class UserLikesService {
    userLikeModel;
    constructor(userLikeModel) {
        this.userLikeModel = userLikeModel;
    }
    async toggleLike(userId, propertyId) {
        const existingLike = await this.userLikeModel.findOne({ userId, propertyId }).exec();
        if (existingLike) {
            await existingLike.deleteOne();
            return { liked: false, propertyId };
        }
        await this.userLikeModel.create({ userId, propertyId });
        return { liked: true, propertyId };
    }
    async getLikedPropertyIds(userId) {
        const likes = await this.userLikeModel.find({ userId }).select('propertyId -_id').lean().exec();
        return likes.map((like) => like.propertyId);
    }
    async isLiked(userId, propertyId) {
        const like = await this.userLikeModel.findOne({ userId, propertyId }).lean().exec();
        return !!like;
    }
};
exports.UserLikesService = UserLikesService;
exports.UserLikesService = UserLikesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_like_schema_1.UserLike.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], UserLikesService);
//# sourceMappingURL=user-likes.service.js.map