import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'node:events';
import Redis from 'ioredis';

interface RedisLikeClient {
  ping(): Promise<string>;
  get(key: string): Promise<string | null>;
  set(...args: any[]): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<string | null>;
  del(...keys: string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  sadd(key: string, ...members: string[]): Promise<number>;
  scard(key: string): Promise<number>;
  sismember(key: string, member: string): Promise<number>;
  srem(key: string, ...members: string[]): Promise<number>;
  lpush(key: string, ...values: string[]): Promise<number>;
  ltrim(key: string, start: number, stop: number): Promise<string | null>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  expire(key: string, seconds: number): Promise<number>;
  hincrby(key: string, field: string, increment: number): Promise<number>;
  hdel(key: string, field: string): Promise<number>;
  hgetall(key: string): Promise<Record<string, string>>;
  publish(channel: string, message: string): Promise<number>;
  flushall(): Promise<string>;
  quit(): Promise<void>;
  on(event: string, listener: (...args: any[]) => void): this;
}

interface RedisLikeSubscriber {
  subscribe(channel: string, callback?: (err: Error | null, count: number) => void): Promise<number>;
  quit(): Promise<void>;
  on(event: 'message', listener: (channel: string, message: string) => void): this;
  on(event: string, listener: (...args: any[]) => void): this;
}

type StoredString = {
  value: string;
  expiresAt?: number;
};

class InMemoryRedisSubscriber extends EventEmitter implements RedisLikeSubscriber {
  private readonly channels = new Set<string>();

  async subscribe(channel: string, callback?: (err: Error | null, count: number) => void) {
    this.channels.add(channel);
    callback?.(null, this.channels.size);
    return this.channels.size;
  }

  emitMessage(channel: string, message: string) {
    this.emit('message', channel, message);
  }

  async quit() {}
}

class InMemoryRedisClient extends EventEmitter implements RedisLikeClient {
  private readonly strings = new Map<string, StoredString>();
  private readonly sets = new Map<string, Set<string>>();
  private readonly lists = new Map<string, string[]>();
  private readonly hashes = new Map<string, Map<string, string>>();

  constructor(private readonly subscriber: InMemoryRedisSubscriber) {
    super();
    process.nextTick(() => this.emit('ready'));
  }

  async ping() {
    return 'PONG';
  }

  async get(key: string) {
    const entry = this.getStringEntry(key);
    return entry ? entry.value : null;
  }

  async set(...args: any[]) {
    const [key, value, ...options] = args as [string, string, ...any[]];
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

  async setex(key: string, seconds: number, value: string) {
    this.strings.set(key, { value, expiresAt: Date.now() + seconds * 1000 });
    this.sets.delete(key);
    this.lists.delete(key);
    this.hashes.delete(key);
    return 'OK';
  }

  async del(...keys: string[]) {
    let deleted = 0;

    for (const key of keys) {
      deleted += this.strings.delete(key) ? 1 : 0;
      deleted += this.sets.delete(key) ? 1 : 0;
      deleted += this.lists.delete(key) ? 1 : 0;
      deleted += this.hashes.delete(key) ? 1 : 0;
    }

    return deleted;
  }

  async keys(pattern: string) {
    const regex = this.globToRegExp(pattern);
    const keys = new Set<string>();

    [this.strings.keys(), this.sets.keys(), this.lists.keys(), this.hashes.keys()].forEach((iterator) => {
      for (const key of iterator) {
        if (regex.test(key) && this.exists(key)) {
          keys.add(key);
        }
      }
    });

    return [...keys];
  }

  async sadd(key: string, ...members: string[]) {
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

  async scard(key: string) {
    return this.getSet(key).size;
  }

  async sismember(key: string, member: string) {
    return this.getSet(key).has(member) ? 1 : 0;
  }

  async srem(key: string, ...members: string[]) {
    const set = this.getSet(key);
    let removed = 0;

    for (const member of members) {
      if (set.delete(member)) {
        removed += 1;
      }
    }

    if (set.size === 0) {
      this.sets.delete(key);
    } else {
      this.sets.set(key, set);
    }

    return removed;
  }

  async lpush(key: string, ...values: string[]) {
    const list = this.getList(key);
    list.unshift(...values);
    this.lists.set(key, list);
    this.strings.delete(key);
    this.sets.delete(key);
    this.hashes.delete(key);
    return list.length;
  }

  async ltrim(key: string, start: number, stop: number) {
    const list = this.getList(key);
    const normalizedStart = Math.max(start, 0);
    const normalizedStop = stop < 0 ? list.length + stop : stop;
    const trimmed = list.slice(normalizedStart, normalizedStop + 1);
    this.lists.set(key, trimmed);
    return 'OK';
  }

  async lrange(key: string, start: number, stop: number) {
    const list = this.getList(key);
    const normalizedStart = start < 0 ? Math.max(list.length + start, 0) : start;
    const normalizedStop = stop < 0 ? list.length + stop : stop;
    return list.slice(normalizedStart, normalizedStop + 1);
  }

  async expire(key: string, seconds: number) {
    const stringEntry = this.strings.get(key);
    if (stringEntry) {
      stringEntry.expiresAt = Date.now() + seconds * 1000;
      return 1;
    }

    return this.sets.has(key) || this.lists.has(key) || this.hashes.has(key) ? 1 : 0;
  }

  async hincrby(key: string, field: string, increment: number) {
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

  async hdel(key: string, field: string) {
    const hash = this.getHash(key);
    const removed = hash.delete(field) ? 1 : 0;

    if (hash.size === 0) {
      this.hashes.delete(key);
    } else {
      this.hashes.set(key, hash);
    }

    return removed;
  }

  async hgetall(key: string) {
    const hash = this.getHash(key);
    return Object.fromEntries(hash.entries());
  }

  async publish(channel: string, message: string) {
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

  async quit() {}

  private getStringEntry(key: string) {
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

  private getSet(key: string) {
    this.cleanupIfExpired(key);
    return new Set(this.sets.get(key) || []);
  }

  private getOrCreateSet(key: string) {
    this.cleanupIfExpired(key);
    return new Set(this.sets.get(key) || []);
  }

  private getList(key: string) {
    this.cleanupIfExpired(key);
    return [...(this.lists.get(key) || [])];
  }

  private getHash(key: string) {
    this.cleanupIfExpired(key);
    return new Map(this.hashes.get(key) || []);
  }

  private getOrCreateHash(key: string) {
    this.cleanupIfExpired(key);
    return new Map(this.hashes.get(key) || []);
  }

  private exists(key: string) {
    return Boolean(this.getStringEntry(key) || this.sets.has(key) || this.lists.has(key) || this.hashes.has(key));
  }

  private cleanupIfExpired(key: string) {
    this.getStringEntry(key);
  }

  private canSetKey(key: string, options: any[]) {
    const hasNx = options.includes('NX');
    if (!hasNx) {
      return true;
    }

    return !this.exists(key);
  }

  private getExpiry(options: any[]) {
    const exIndex = options.indexOf('EX');
    if (exIndex >= 0 && typeof options[exIndex + 1] === 'number') {
      return Date.now() + options[exIndex + 1] * 1000;
    }

    return undefined;
  }

  private globToRegExp(pattern: string) {
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    const regex = `^${escaped.replace(/\*/g, '.*').replace(/\?/g, '.')}$`;
    return new RegExp(regex);
  }
}

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  public client: any;
  public subscriber: any;

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

      this.client = new Redis(redisUrl, redisOptions);
      this.subscriber = new Redis(redisUrl, {
        ...redisOptions,
        lazyConnect: true,
      });

      // Client event handlers
      this.client.on('ready', () => {
        this.logger.log('Redis Client: Connected and ready');
      });

      this.client.on('reconnecting', () => {
        this.logger.warn('Redis Client: Reconnecting...');
      });

      this.client.on('error', (err: Error) => {
        this.logger.error('Redis Client Error:', err.message);
      });

      this.client.on('close', () => {
        this.logger.warn('Redis Client: Connection closed');
      });

      // Subscriber event handlers
      this.subscriber.on('ready', () => {
        this.logger.log('Redis Subscriber: Connected and ready');
      });

      this.subscriber.on('reconnecting', () => {
        this.logger.warn('Redis Subscriber: Reconnecting...');
      });

      this.subscriber.on('error', (err: Error) => {
        this.logger.error('Redis Subscriber Error:', err.message);
      });

      this.subscriber.on('close', () => {
        this.logger.warn('Redis Subscriber: Connection closed');
      });

      this.logger.log('Redis Service initialized');
    } catch (error) {
      this.useInMemoryFallback(error instanceof Error ? error.message : 'Unknown Redis error');
    }
  }

  // ============ Generic Methods ============
  async get(key: string): Promise<any> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.warn(`Error getting key ${key}: ${error.message}`);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      this.logger.warn(`Error setting key ${key}: ${error.message}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.warn(`Error deleting key ${key}: ${error.message}`);
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      this.logger.warn(`Error deleting pattern ${pattern}: ${error.message}`);
    }
  }

  // ============ Calendar Methods (Booked Dates) ============
  async addBookedDates(propertyId: string, dates: string[]): Promise<void> {
    try {
      const key = `calendar:${propertyId}`;
      await this.client.sadd(key, ...dates);
    } catch (error) {
      this.logger.warn(`Error adding booked dates for property ${propertyId}: ${error.message}`);
    }
  }

  async isAvailable(propertyId: string, dates: string[]): Promise<boolean> {
    try {
      const key = `calendar:${propertyId}`;
      if (dates.length === 0) return true;

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
    } catch (error) {
      this.logger.warn(`Error checking availability for property ${propertyId}: ${error.message}`);
      return true; // Fallback: allow booking if Redis fails
    }
  }

  async lockProperty(propertyId: string, ttlSeconds: number = 600): Promise<boolean> {
    try {
      const key = `lock:${propertyId}`;
      const result = await this.client.set(key, '1', 'EX', ttlSeconds, 'NX');
      return result === 'OK'; // Returns true if lock acquired, false if already exists
    } catch (error) {
      this.logger.warn(`Error locking property ${propertyId}: ${error.message}`);
      return false;
    }
  }

  async unlockProperty(propertyId: string): Promise<void> {
    try {
      const key = `lock:${propertyId}`;
      await this.client.del(key);
    } catch (error) {
      this.logger.warn(`Error unlocking property ${propertyId}: ${error.message}`);
    }
  }

  // ============ Rating Methods ============
  async setRating(propertyId: string, rating: number, count: number): Promise<void> {
    try {
      const key = `rating:${propertyId}`;
      const value = `${rating.toFixed(2)}:${count}`;
      // Store for 1 hour (3600 seconds)
      await this.client.setex(key, 3600, value);
    } catch (error) {
      this.logger.warn(`Error setting rating for property ${propertyId}: ${error.message}`);
    }
  }

  async getRating(propertyId: string): Promise<{ rating: number; count: number } | null> {
    try {
      const key = `rating:${propertyId}`;
      const value = await this.client.get(key);
      if (!value) return null;

      const [rating, count] = value.split(':');
      return {
        rating: parseFloat(rating),
        count: parseInt(count, 10),
      };
    } catch (error) {
      this.logger.warn(`Error getting rating for property ${propertyId}: ${error.message}`);
      return null;
    }
  }

  // ============ Review Methods ============
  async addReview(propertyId: string, review: any): Promise<void> {
    try {
      const key = `reviews:${propertyId}`;
      const serialized = JSON.stringify(review);
      // LPUSH to prepend and LTRIM to keep only last 10
      await this.client.lpush(key, serialized);
      await this.client.ltrim(key, 0, 9);
      // Set expiration to 24 hours
      await this.client.expire(key, 86400);
    } catch (error) {
      this.logger.warn(`Error adding review for property ${propertyId}: ${error.message}`);
    }
  }

  async getReviews(propertyId: string): Promise<any[]> {
    try {
      const key = `reviews:${propertyId}`;
      const reviews = await this.client.lrange(key, 0, 9);
      return reviews.map((review: string) => JSON.parse(review));
    } catch (error) {
      this.logger.warn(`Error getting reviews for property ${propertyId}: ${error.message}`);
      return [];
    }
  }

  // ============ Chat Methods (Pub/Sub) ============
  async publish(channel: string, message: any): Promise<void> {
    try {
      const serialized = JSON.stringify(message);
      await this.client.publish(channel, serialized);
    } catch (error) {
      this.logger.warn(`Error publishing to channel ${channel}: ${error.message}`);
    }
  }

  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    try {
      await this.subscriber.subscribe(channel, (err: Error | null, count: number) => {
        if (err) {
          this.logger.warn(`Error subscribing to channel ${channel}: ${err.message}`);
        } else {
          this.logger.log(`Subscribed to ${count} channel(s)`);
        }
      });

      this.subscriber.on('message', (subscribedChannel: string, message: string) => {
        if (subscribedChannel === channel) {
          try {
            const parsedMessage = JSON.parse(message);
            callback(parsedMessage);
          } catch (error) {
            this.logger.warn(`Error parsing message from channel ${channel}: ${error.message}`);
          }
        }
      });
    } catch (error) {
      this.logger.warn(`Error setting up subscription for channel ${channel}: ${error.message}`);
    }
  }

  // ============ Helper method for incrementing unread messages ============
  async incrementUnread(toUserId: string, fromUserId: string, count: number = 1): Promise<void> {
    try {
      const key = `unread:${toUserId}`;
      await this.client.hincrby(key, fromUserId, count);
      // Set expiration to 7 days
      await this.client.expire(key, 604800);
    } catch (error) {
      this.logger.warn(`Error incrementing unread for user ${toUserId}: ${error.message}`);
    }
  }

  async removeUnread(toUserId: string, fromUserId: string): Promise<void> {
    try {
      const key = `unread:${toUserId}`;
      await this.client.hdel(key, fromUserId);
    } catch (error) {
      this.logger.warn(`Error removing unread for user ${toUserId}: ${error.message}`);
    }
  }

  async getUnread(toUserId: string): Promise<Record<string, number>> {
    try {
      const key = `unread:${toUserId}`;
      const unread = await this.client.hgetall(key);
      const result: Record<string, number> = {};
      Object.keys(unread).forEach((userId) => {
        result[userId] = parseInt(unread[userId], 10);
      });
      return result;
    } catch (error) {
      this.logger.warn(`Error getting unread for user ${toUserId}: ${error.message}`);
      return {};
    }
  }

  // ============ Cleanup ============
  async onModuleDestroy() {
    await this.client.quit();
    await this.subscriber.quit();
    this.logger.log('Redis connections closed');
  }

  private useInMemoryFallback(reason: string) {
    const subscriber = new InMemoryRedisSubscriber();
    const client = new InMemoryRedisClient(subscriber);

    this.client = client;
    this.subscriber = subscriber;
    this.logger.warn(`Redis disabled, using in-memory fallback (${reason})`);
  }
}
