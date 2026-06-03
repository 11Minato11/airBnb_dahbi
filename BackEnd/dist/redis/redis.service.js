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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const ioredis_1 = __importDefault(require("ioredis"));
let RedisService = RedisService_1 = class RedisService {
    logger = new common_1.Logger(RedisService_1.name);
    client;
    subscriber;
    constructor() {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        try {
            const redisOptions = {
                retryStrategy: (times) => {
                    const delay = Math.min(times * 50, 2000);
                    return delay;
                },
                enableReadyCheck: false,
                enableOfflineQueue: false,
                maxRetriesPerRequest: 5,
                connectTimeout: 10000,
                commandTimeout: 5000,
                keepAlive: 30000,
                tls: redisUrl.startsWith('rediss://') ? {} : undefined,
            };
            this.client = new ioredis_1.default(redisUrl, redisOptions);
            this.subscriber = new ioredis_1.default(redisUrl, {
                ...redisOptions,
                lazyConnect: true,
            });
            this.client.on('ready', () => {
                this.logger.log('Redis Client: Connected and ready');
            });
            this.client.on('reconnecting', () => {
                this.logger.warn('Redis Client: Reconnecting...');
            });
            this.client.on('error', (err) => {
                this.logger.error('Redis Client Error:', err.message);
            });
            this.client.on('close', () => {
                this.logger.warn('Redis Client: Connection closed');
            });
            this.subscriber.on('ready', () => {
                this.logger.log('Redis Subscriber: Connected and ready');
            });
            this.subscriber.on('reconnecting', () => {
                this.logger.warn('Redis Subscriber: Reconnecting...');
            });
            this.subscriber.on('error', (err) => {
                this.logger.error('Redis Subscriber Error:', err.message);
            });
            this.subscriber.on('close', () => {
                this.logger.warn('Redis Subscriber: Connection closed');
            });
            this.logger.log('Redis Service initialized');
        }
        catch (error) {
            this.logger.error('Failed to initialize Redis:', error);
        }
    }
    async get(key) {
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        }
        catch (error) {
            this.logger.warn(`Error getting key ${key}: ${error.message}`);
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        try {
            const serialized = JSON.stringify(value);
            if (ttlSeconds) {
                await this.client.setex(key, ttlSeconds, serialized);
            }
            else {
                await this.client.set(key, serialized);
            }
        }
        catch (error) {
            this.logger.warn(`Error setting key ${key}: ${error.message}`);
        }
    }
    async del(key) {
        try {
            await this.client.del(key);
        }
        catch (error) {
            this.logger.warn(`Error deleting key ${key}: ${error.message}`);
        }
    }
    async delPattern(pattern) {
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(...keys);
            }
        }
        catch (error) {
            this.logger.warn(`Error deleting pattern ${pattern}: ${error.message}`);
        }
    }
    async addBookedDates(propertyId, dates) {
        try {
            const key = `calendar:${propertyId}`;
            await this.client.sadd(key, ...dates);
        }
        catch (error) {
            this.logger.warn(`Error adding booked dates for property ${propertyId}: ${error.message}`);
        }
    }
    async isAvailable(propertyId, dates) {
        try {
            const key = `calendar:${propertyId}`;
            if (dates.length === 0)
                return true;
            const bookedCount = await this.client.scard(key);
            if (bookedCount === 0) {
                return true;
            }
            const result = await this.client.sinter(key, ...dates);
            return result.length === 0;
        }
        catch (error) {
            this.logger.warn(`Error checking availability for property ${propertyId}: ${error.message}`);
            return true;
        }
    }
    async lockProperty(propertyId, ttlSeconds = 600) {
        try {
            const key = `lock:${propertyId}`;
            const result = await this.client.set(key, '1', 'EX', ttlSeconds, 'NX');
            return result === 'OK';
        }
        catch (error) {
            this.logger.warn(`Error locking property ${propertyId}: ${error.message}`);
            return false;
        }
    }
    async unlockProperty(propertyId) {
        try {
            const key = `lock:${propertyId}`;
            await this.client.del(key);
        }
        catch (error) {
            this.logger.warn(`Error unlocking property ${propertyId}: ${error.message}`);
        }
    }
    async setRating(propertyId, rating, count) {
        try {
            const key = `rating:${propertyId}`;
            const value = `${rating.toFixed(2)}:${count}`;
            await this.client.setex(key, 3600, value);
        }
        catch (error) {
            this.logger.warn(`Error setting rating for property ${propertyId}: ${error.message}`);
        }
    }
    async getRating(propertyId) {
        try {
            const key = `rating:${propertyId}`;
            const value = await this.client.get(key);
            if (!value)
                return null;
            const [rating, count] = value.split(':');
            return {
                rating: parseFloat(rating),
                count: parseInt(count, 10),
            };
        }
        catch (error) {
            this.logger.warn(`Error getting rating for property ${propertyId}: ${error.message}`);
            return null;
        }
    }
    async addReview(propertyId, review) {
        try {
            const key = `reviews:${propertyId}`;
            const serialized = JSON.stringify(review);
            await this.client.lpush(key, serialized);
            await this.client.ltrim(key, 0, 9);
            await this.client.expire(key, 86400);
        }
        catch (error) {
            this.logger.warn(`Error adding review for property ${propertyId}: ${error.message}`);
        }
    }
    async getReviews(propertyId) {
        try {
            const key = `reviews:${propertyId}`;
            const reviews = await this.client.lrange(key, 0, 9);
            return reviews.map((review) => JSON.parse(review));
        }
        catch (error) {
            this.logger.warn(`Error getting reviews for property ${propertyId}: ${error.message}`);
            return [];
        }
    }
    async publish(channel, message) {
        try {
            const serialized = JSON.stringify(message);
            await this.client.publish(channel, serialized);
        }
        catch (error) {
            this.logger.warn(`Error publishing to channel ${channel}: ${error.message}`);
        }
    }
    async subscribe(channel, callback) {
        try {
            await this.subscriber.subscribe(channel, (err, count) => {
                if (err) {
                    this.logger.warn(`Error subscribing to channel ${channel}: ${err.message}`);
                }
                else {
                    this.logger.log(`Subscribed to ${count} channel(s)`);
                }
            });
            this.subscriber.on('message', (subscribedChannel, message) => {
                if (subscribedChannel === channel) {
                    try {
                        const parsedMessage = JSON.parse(message);
                        callback(parsedMessage);
                    }
                    catch (error) {
                        this.logger.warn(`Error parsing message from channel ${channel}: ${error.message}`);
                    }
                }
            });
        }
        catch (error) {
            this.logger.warn(`Error setting up subscription for channel ${channel}: ${error.message}`);
        }
    }
    async incrementUnread(toUserId, fromUserId, count = 1) {
        try {
            const key = `unread:${toUserId}`;
            await this.client.hincrby(key, fromUserId, count);
            await this.client.expire(key, 604800);
        }
        catch (error) {
            this.logger.warn(`Error incrementing unread for user ${toUserId}: ${error.message}`);
        }
    }
    async removeUnread(toUserId, fromUserId) {
        try {
            const key = `unread:${toUserId}`;
            await this.client.hdel(key, fromUserId);
        }
        catch (error) {
            this.logger.warn(`Error removing unread for user ${toUserId}: ${error.message}`);
        }
    }
    async getUnread(toUserId) {
        try {
            const key = `unread:${toUserId}`;
            const unread = await this.client.hgetall(key);
            const result = {};
            Object.keys(unread).forEach((userId) => {
                result[userId] = parseInt(unread[userId], 10);
            });
            return result;
        }
        catch (error) {
            this.logger.warn(`Error getting unread for user ${toUserId}: ${error.message}`);
            return {};
        }
    }
    async onModuleDestroy() {
        await this.client.quit();
        await this.subscriber.quit();
        this.logger.log('Redis connections closed');
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], RedisService);
//# sourceMappingURL=redis.service.js.map