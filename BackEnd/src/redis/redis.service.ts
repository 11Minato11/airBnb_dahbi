import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  public client: Redis;
  public subscriber: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    try {
      // ioredis configuration optimized for Upstash
      const redisOptions = {
        // Retry strategy
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        // Connection settings
        enableReadyCheck: false,
        enableOfflineQueue: false,
        // Upstash-specific settings
        maxRetriesPerRequest: 5,
        connectTimeout: 10000,
        commandTimeout: 5000,
        // Socket settings
        keepAlive: 30000,
        // TLS for Upstash
        tls: redisUrl.startsWith('rediss://') ? {} : undefined,
      };

      this.client = new Redis(redisUrl, redisOptions);

      // Create a separate subscriber for Pub/Sub
      this.subscriber = new Redis(redisUrl, {
        ...redisOptions,
        // Subscriber-specific settings
        lazyConnect: true,
      });

      // Client event handlers
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

      // Subscriber event handlers
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
    } catch (error) {
      this.logger.error('Failed to initialize Redis:', error);
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

      // Check if any of the requested dates are in the booked set
      const bookedCount = await this.client.scard(key);
      if (bookedCount === 0) {
        return true; // No booked dates
      }

      // Check intersection of requested dates with booked dates
      const result = await this.client.sinter(key, ...dates);
      return result.length === 0; // true if no overlap (empty intersection)
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
      return reviews.map((review) => JSON.parse(review));
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
      await this.subscriber.subscribe(channel, (err, count) => {
        if (err) {
          this.logger.warn(`Error subscribing to channel ${channel}: ${err.message}`);
        } else {
          this.logger.log(`Subscribed to ${count} channel(s)`);
        }
      });

      this.subscriber.on('message', (subscribedChannel, message) => {
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
}
