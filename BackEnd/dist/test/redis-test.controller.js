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
exports.RedisTestController = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../redis/redis.service");
const properties_service_1 = require("../properties/properties.service");
let RedisTestController = class RedisTestController {
    redisService;
    propertiesService;
    constructor(redisService, propertiesService) {
        this.redisService = redisService;
        this.propertiesService = propertiesService;
    }
    async ping() {
        try {
            const result = await this.redisService.client.ping();
            return { status: 'OK', message: 'Redis is connected', result };
        }
        catch (error) {
            return { status: 'ERROR', message: 'Redis connection failed', error: error.message };
        }
    }
    async set(body) {
        try {
            await this.redisService.set(body.key, body.value, body.ttl);
            return { status: 'OK', message: `Key '${body.key}' set successfully` };
        }
        catch (error) {
            return { status: 'ERROR', message: error.message };
        }
    }
    async get(key) {
        try {
            const value = await this.redisService.get(key);
            return { status: 'OK', key, value };
        }
        catch (error) {
            return { status: 'ERROR', message: error.message };
        }
    }
    async delete(key) {
        try {
            await this.redisService.del(key);
            return { status: 'OK', message: `Key '${key}' deleted` };
        }
        catch (error) {
            return { status: 'ERROR', message: error.message };
        }
    }
    async addBookedDates(body) {
        try {
            await this.redisService.addBookedDates(body.propertyId, body.dates);
            return { status: 'OK', message: 'Dates added to calendar' };
        }
        catch (error) {
            return { status: 'ERROR', message: error.message };
        }
    }
    async checkAvailability(body) {
        try {
            const available = await this.redisService.isAvailable(body.propertyId, body.dates);
            return {
                status: 'OK',
                propertyId: body.propertyId,
                dates: body.dates,
                available,
            };
        }
        catch (error) {
            return { status: 'ERROR', message: error.message };
        }
    }
    async acquireLock(body) {
        try {
            const acquired = await this.redisService.lockProperty(body.propertyId, body.ttl || 600);
            return {
                status: 'OK',
                propertyId: body.propertyId,
                acquired,
            };
        }
        catch (error) {
            return { status: 'ERROR', message: error.message };
        }
    }
    async releaseLock(body) {
        try {
            await this.redisService.unlockProperty(body.propertyId);
            return { status: 'OK', message: 'Lock released' };
        }
        catch (error) {
            return { status: 'ERROR', message: error.message };
        }
    }
    async setRating(body) {
        try {
            await this.redisService.setRating(body.propertyId, body.rating, body.count);
            return { status: 'OK', message: 'Rating set' };
        }
        catch (error) {
            return { status: 'ERROR', message: error.message };
        }
    }
    async getRating(propertyId) {
        try {
            const rating = await this.redisService.getRating(propertyId);
            return { status: 'OK', propertyId, rating };
        }
        catch (error) {
            return { status: 'ERROR', message: error.message };
        }
    }
    async addReview(body) {
        try {
            await this.redisService.addReview(body.propertyId, body.review);
            return { status: 'OK', message: 'Review added' };
        }
        catch (error) {
            return { status: 'ERROR', message: error.message };
        }
    }
    async getReviews(propertyId) {
        try {
            const reviews = await this.redisService.getReviews(propertyId);
            return { status: 'OK', propertyId, reviews };
        }
        catch (error) {
            return { status: 'ERROR', message: error.message };
        }
    }
    async incrementUnread(body) {
        try {
            await this.redisService.incrementUnread(body.toUserId, body.fromUserId, body.count || 1);
            return { status: 'OK', message: 'Unread incremented' };
        }
        catch (error) {
            return { status: 'ERROR', message: error.message };
        }
    }
    async getUnread(userId) {
        try {
            const unread = await this.redisService.getUnread(userId);
            return { status: 'OK', userId, unread };
        }
        catch (error) {
            return { status: 'ERROR', message: error.message };
        }
    }
    async testSearch() {
        try {
            const results = await this.propertiesService.search('Paris', 2, '2026-06-10', '2026-06-15', 50, 500);
            return { status: 'OK', message: 'Search completed', count: results.length };
        }
        catch (error) {
            return { status: 'ERROR', message: error.message };
        }
    }
    async getAllKeys() {
        try {
            const keys = await this.redisService.client.keys('*');
            return { status: 'OK', keysCount: keys.length, keys };
        }
        catch (error) {
            return { status: 'ERROR', message: error.message };
        }
    }
    async flushAll() {
        try {
            await this.redisService.client.flushall();
            return { status: 'OK', message: 'All Redis keys flushed' };
        }
        catch (error) {
            return { status: 'ERROR', message: error.message };
        }
    }
};
exports.RedisTestController = RedisTestController;
__decorate([
    (0, common_1.Get)('ping'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RedisTestController.prototype, "ping", null);
__decorate([
    (0, common_1.Post)('set'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RedisTestController.prototype, "set", null);
__decorate([
    (0, common_1.Get)('get/:key'),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RedisTestController.prototype, "get", null);
__decorate([
    (0, common_1.Post)('delete/:key'),
    __param(0, (0, common_1.Param)('key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RedisTestController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)('calendar/add'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RedisTestController.prototype, "addBookedDates", null);
__decorate([
    (0, common_1.Post)('calendar/check'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RedisTestController.prototype, "checkAvailability", null);
__decorate([
    (0, common_1.Post)('lock/acquire'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RedisTestController.prototype, "acquireLock", null);
__decorate([
    (0, common_1.Post)('lock/release'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RedisTestController.prototype, "releaseLock", null);
__decorate([
    (0, common_1.Post)('rating/set'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RedisTestController.prototype, "setRating", null);
__decorate([
    (0, common_1.Get)('rating/get/:propertyId'),
    __param(0, (0, common_1.Param)('propertyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RedisTestController.prototype, "getRating", null);
__decorate([
    (0, common_1.Post)('review/add'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RedisTestController.prototype, "addReview", null);
__decorate([
    (0, common_1.Get)('review/list/:propertyId'),
    __param(0, (0, common_1.Param)('propertyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RedisTestController.prototype, "getReviews", null);
__decorate([
    (0, common_1.Post)('unread/increment'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RedisTestController.prototype, "incrementUnread", null);
__decorate([
    (0, common_1.Get)('unread/get/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RedisTestController.prototype, "getUnread", null);
__decorate([
    (0, common_1.Get)('search/test'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RedisTestController.prototype, "testSearch", null);
__decorate([
    (0, common_1.Get)('keys/all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RedisTestController.prototype, "getAllKeys", null);
__decorate([
    (0, common_1.Post)('keys/flush'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RedisTestController.prototype, "flushAll", null);
exports.RedisTestController = RedisTestController = __decorate([
    (0, common_1.Controller)('test/redis'),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        properties_service_1.PropertiesService])
], RedisTestController);
//# sourceMappingURL=redis-test.controller.js.map