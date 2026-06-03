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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserLikeSchema = exports.UserLike = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let UserLike = class UserLike {
    userId;
    propertyId;
};
exports.UserLike = UserLike;
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], UserLike.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], UserLike.prototype, "propertyId", void 0);
exports.UserLike = UserLike = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'user_likes' })
], UserLike);
exports.UserLikeSchema = mongoose_1.SchemaFactory.createForClass(UserLike);
exports.UserLikeSchema.index({ userId: 1, propertyId: 1 }, { unique: true });
//# sourceMappingURL=user-like.schema.js.map