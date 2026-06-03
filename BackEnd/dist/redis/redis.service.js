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
const node_events_1 = require("node:events");
const ioredis_1 = __importDefault(require("ioredis"));
class InMemoryRedisSubscriber extends node_events_1.EventEmitter {
    channels = new Set();
    async subscribe(channel, callback) {
        this.channels.add(channel);
        callback?.(null, this.channels.size);
        return this.channels.size;
    }
    emitMessage(channel, message) {
        this.emit('message', channel, message);
    }
    async quit() { }
}
class InMemoryRedisClient extends node_events_1.EventEmitter {
    subscriber;
    strings = new Map();
    sets = new Map();
    lists = new Map();
    hashes = new Map();
    constructor(subscriber) {
        super();
        this.subscriber = subscriber;
        process.nextTick(() => this.emit('ready'));
    }
    async ping() {
        return 'PONG';
    }
    async get(key) {
        const entry = this.getStringEntry(key);
        return entry ? entry.value : null;
    }
    async set(...args) {
        const [key, value, ...options] = args;
        const shouldSet = this.canSetKey(key, options);
        if (!shouldSet) {
            return null;
        }
        const expiresAt = this.getExpiry(options);
        this.strings.set(key, { value, expiresAt });
        this.sets.delete(key);
        this.lists.delete(key);
        this.hashes.delete(key);
        return 'OK';
    }
    async setex(key, seconds, value) {
        this.strings.set(key, { value, expiresAt: Date.now() + seconds * 1000 });
        this.sets.delete(key);
        this.lists.delete(key);
        this.hashes.delete(key);
        return 'OK';
    }
    async del(...keys) {
        let deleted = 0;
        for (const key of keys) {
            deleted += this.strings.delete(key) ? 1 : 0;
            deleted += this.sets.delete(key) ? 1 : 0;
            deleted += this.lists.delete(key) ? 1 : 0;
            deleted += this.hashes.delete(key) ? 1 : 0;
        }
        return deleted;
    }
    async keys(pattern) {
        const regex = this.globToRegExp(pattern);
        const keys = new Set();
        [this.strings.keys(), this.sets.keys(), this.lists.keys(), this.hashes.keys()].forEach((iterator) => {
            for (const key of iterator) {
                if (regex.test(key) && this.exists(key)) {
                    keys.add(key);
                }
            }
        });
        return [...keys];
    }
    async sadd(key, ...members) {
        const set = this.getOrCreateSet(key);
        let added = 0;
        for (const member of members) {
            if (!set.has(member)) {
                set.add(member);
                added += 1;
            }
        }
        this.sets.set(key, set);
        this.strings.delete(key);
        this.lists.delete(key);
        this.hashes.delete(key);
        return added;
    }
    async scard(key) {
        return this.getSet(key).size;
    }
    async sismember(key, member) {
        return this.getSet(key).has(member) ? 1 : 0;
    }
    async srem(key, ...members) {
        const set = this.getSet(key);
        let removed = 0;
        for (const member of members) {
            if (set.delete(member)) {
                removed += 1;
            }
        }
        if (set.size === 0) {
            this.sets.delete(key);
        }
        else {
            this.sets.set(key, set);
        }
        return removed;
    }
    async lpush(key, ...values) {
        const list = this.getList(key);
        list.unshift(...values);
        this.lists.set(key, list);
        this.strings.delete(key);
        this.sets.delete(key);
        this.hashes.delete(key);
        return list.length;
    }
    async ltrim(key, start, stop) {
        const list = this.getList(key);
        const normalizedStart = Math.max(start, 0);
        const normalizedStop = stop < 0 ? list.length + stop : stop;
        const trimmed = list.slice(normalizedStart, normalizedStop + 1);
        this.lists.set(key, trimmed);
        return 'OK';
    }
    async lrange(key, start, stop) {
        const list = this.getList(key);
        const normalizedStart = start < 0 ? Math.max(list.length + start, 0) : start;
        const normalizedStop = stop < 0 ? list.length + stop : stop;
        return list.slice(normalizedStart, normalizedStop + 1);
    }
    async expire(key, seconds) {
        const stringEntry = this.strings.get(key);
        if (stringEntry) {
            stringEntry.expiresAt = Date.now() + seconds * 1000;
            return 1;
        }
        return this.sets.has(key) || this.lists.has(key) || this.hashes.has(key) ? 1 : 0;
    }
    async hincrby(key, field, increment) {
        const hash = this.getOrCreateHash(key);
        const current = parseInt(hash.get(field) || '0', 10);
        const next = current + increment;
        hash.set(field, String(next));
        this.hashes.set(key, hash);
        this.strings.delete(key);
        this.sets.delete(key);
        this.lists.delete(key);
        return next;
    }
    async hdel(key, field) {
        const hash = this.getHash(key);
        const removed = hash.delete(field) ? 1 : 0;
        if (hash.size === 0) {
            this.hashes.delete(key);
        }
        else {
            this.hashes.set(key, hash);
        }
        return removed;
    }
    async hgetall(key) {
        const hash = this.getHash(key);
        return Object.fromEntries(hash.entries());
    }
    async publish(channel, message) {
        this.subscriber.emitMessage(channel, message);
        return 1;
    }
    async flushall() {
        this.strings.clear();
        this.sets.clear();
        this.lists.clear();
        this.hashes.clear();
        return 'OK';
    }
    async quit() { }
    getStringEntry(key) {
        const entry = this.strings.get(key);
        if (!entry) {
            return null;
        }
        if (entry.expiresAt && entry.expiresAt <= Date.now()) {
            this.strings.delete(key);
            return null;
        }
        return entry;
    }
    getSet(key) {
        this.cleanupIfExpired(key);
        return new Set(this.sets.get(key) || []);
    }
    getOrCreateSet(key) {
        this.cleanupIfExpired(key);
        return new Set(this.sets.get(key) || []);
    }
    getList(key) {
        this.cleanupIfExpired(key);
        return [...(this.lists.get(key) || [])];
    }
    getHash(key) {
        this.cleanupIfExpired(key);
        return new Map(this.hashes.get(key) || []);
    }
    getOrCreateHash(key) {
        this.cleanupIfExpired(key);
        return new Map(this.hashes.get(key) || []);
    }
    exists(key) {
        return Boolean(this.getStringEntry(key) || this.sets.has(key) || this.lists.has(key) || this.hashes.has(key));
    }
    cleanupIfExpired(key) {
        this.getStringEntry(key);
    }
    canSetKey(key, options) {
        const hasNx = options.includes('NX');
        if (!hasNx) {
            return true;
        }
        return !this.exists(key);
    }
    getExpiry(options) {
        const exIndex = options.indexOf('EX');
        if (exIndex >= 0 && typeof options[exIndex + 1] === 'number') {
            return Date.now() + options[exIndex + 1] * 1000;
        }
        return undefined;
    }
    globToRegExp(pattern) {
        const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
        const regex = `^${escaped.replace(/\*/g, '.*').replace(/\?/g, '.')}$`;
        return new RegExp(regex);
    }
}
let RedisService = RedisService_1 = class RedisService {
    logger = new common_1.Logger(RedisService_1.name);
    client;
    subscriber;
    constructor() {
        const redisUrl = process.env.REDIS_URL?.trim();
        if (!redisUrl) {
            this.useInMemoryFallback('REDIS_URL is not set');
            return;
        }
        try {
            const redisOptions = {
                retryStrategy: () => null,
                enableReadyCheck: false,
                enableOfflineQueue: false,
                maxRetriesPerRequest: 1,
                connectTimeout: 3000,
                commandTimeout: 3000,
                keepAlive: 30000,
                tls: redisUrl.startsWith('rediss://') ? {} : undefined,
                lazyConnect: true,
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
            this.useInMemoryFallback(error instanceof Error ? error.message : 'Unknown Redis error');
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
            for (const date of dates) {
                const isBooked = await this.client.sismember(key, date);
                if (isBooked === 1) {
                    return false;
                }
            }
            return true;
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
    useInMemoryFallback(reason) {
        const subscriber = new InMemoryRedisSubscriber();
        const client = new InMemoryRedisClient(subscriber);
        this.client = client;
        this.subscriber = subscriber;
        this.logger.warn(`Redis disabled, using in-memory fallback (${reason})`);
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], RedisService);
//# sourceMappingURL=redis.service.js.map