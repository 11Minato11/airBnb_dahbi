import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { PropertiesService } from '../properties/properties.service';

@Controller('test/redis')
export class RedisTestController {
  constructor(
    private readonly redisService: RedisService,
    private readonly propertiesService: PropertiesService,
  ) {}

  // Test connection
  @Get('ping')
  async ping() {
    try {
      const result = await this.redisService.client.ping();
      return { status: 'OK', message: 'Redis is connected', result };
    } catch (error) {
      return { status: 'ERROR', message: 'Redis connection failed', error: error.message };
    }
  }

  // Test generic set/get
  @Post('set')
  async set(@Body() body: { key: string; value: any; ttl?: number }) {
    try {
      await this.redisService.set(body.key, body.value, body.ttl);
      return { status: 'OK', message: `Key '${body.key}' set successfully` };
    } catch (error) {
      return { status: 'ERROR', message: error.message };
    }
  }

  @Get('get/:key')
  async get(@Param('key') key: string) {
    try {
      const value = await this.redisService.get(key);
      return { status: 'OK', key, value };
    } catch (error) {
      return { status: 'ERROR', message: error.message };
    }
  }

  @Post('delete/:key')
  async delete(@Param('key') key: string) {
    try {
      await this.redisService.del(key);
      return { status: 'OK', message: `Key '${key}' deleted` };
    } catch (error) {
      return { status: 'ERROR', message: error.message };
    }
  }

  // Test calendar/booking
  @Post('calendar/add')
  async addBookedDates(
    @Body() body: { propertyId: string; dates: string[] },
  ) {
    try {
      await this.redisService.addBookedDates(body.propertyId, body.dates);
      return { status: 'OK', message: 'Dates added to calendar' };
    } catch (error) {
      return { status: 'ERROR', message: error.message };
    }
  }

  @Post('calendar/check')
  async checkAvailability(
    @Body() body: { propertyId: string; dates: string[] },
  ) {
    try {
      const available = await this.redisService.isAvailable(body.propertyId, body.dates);
      return {
        status: 'OK',
        propertyId: body.propertyId,
        dates: body.dates,
        available,
      };
    } catch (error) {
      return { status: 'ERROR', message: error.message };
    }
  }

  // Test lock
  @Post('lock/acquire')
  async acquireLock(@Body() body: { propertyId: string; ttl?: number }) {
    try {
      const acquired = await this.redisService.lockProperty(
        body.propertyId,
        body.ttl || 600,
      );
      return {
        status: 'OK',
        propertyId: body.propertyId,
        acquired,
      };
    } catch (error) {
      return { status: 'ERROR', message: error.message };
    }
  }

  @Post('lock/release')
  async releaseLock(@Body() body: { propertyId: string }) {
    try {
      await this.redisService.unlockProperty(body.propertyId);
      return { status: 'OK', message: 'Lock released' };
    } catch (error) {
      return { status: 'ERROR', message: error.message };
    }
  }

  // Test rating
  @Post('rating/set')
  async setRating(
    @Body() body: { propertyId: string; rating: number; count: number },
  ) {
    try {
      await this.redisService.setRating(body.propertyId, body.rating, body.count);
      return { status: 'OK', message: 'Rating set' };
    } catch (error) {
      return { status: 'ERROR', message: error.message };
    }
  }

  @Get('rating/get/:propertyId')
  async getRating(@Param('propertyId') propertyId: string) {
    try {
      const rating = await this.redisService.getRating(propertyId);
      return { status: 'OK', propertyId, rating };
    } catch (error) {
      return { status: 'ERROR', message: error.message };
    }
  }

  // Test reviews
  @Post('review/add')
  async addReview(
    @Body() body: { propertyId: string; review: any },
  ) {
    try {
      await this.redisService.addReview(body.propertyId, body.review);
      return { status: 'OK', message: 'Review added' };
    } catch (error) {
      return { status: 'ERROR', message: error.message };
    }
  }

  @Get('review/list/:propertyId')
  async getReviews(@Param('propertyId') propertyId: string) {
    try {
      const reviews = await this.redisService.getReviews(propertyId);
      return { status: 'OK', propertyId, reviews };
    } catch (error) {
      return { status: 'ERROR', message: error.message };
    }
  }

  // Test unread messages
  @Post('unread/increment')
  async incrementUnread(
    @Body() body: { toUserId: string; fromUserId: string; count?: number },
  ) {
    try {
      await this.redisService.incrementUnread(body.toUserId, body.fromUserId, body.count || 1);
      return { status: 'OK', message: 'Unread incremented' };
    } catch (error) {
      return { status: 'ERROR', message: error.message };
    }
  }

  @Get('unread/get/:userId')
  async getUnread(@Param('userId') userId: string) {
    try {
      const unread = await this.redisService.getUnread(userId);
      return { status: 'OK', userId, unread };
    } catch (error) {
      return { status: 'ERROR', message: error.message };
    }
  }

  // Test search cache
  @Get('search/test')
  async testSearch() {
    try {
      const results = await this.propertiesService.search(
        'Paris',
        2,
        '2026-06-10',
        '2026-06-15',
        50,
        500,
      );
      return { status: 'OK', message: 'Search completed', count: results.length };
    } catch (error) {
      return { status: 'ERROR', message: error.message };
    }
  }

  // Show all Redis keys
  @Get('keys/all')
  async getAllKeys() {
    try {
      const keys = await this.redisService.client.keys('*');
      return { status: 'OK', keysCount: keys.length, keys };
    } catch (error) {
      return { status: 'ERROR', message: error.message };
    }
  }

  // Clear all Redis keys (use with caution!)
  @Post('keys/flush')
  async flushAll() {
    try {
      await this.redisService.client.flushall();
      return { status: 'OK', message: 'All Redis keys flushed' };
    } catch (error) {
      return { status: 'ERROR', message: error.message };
    }
  }
}
