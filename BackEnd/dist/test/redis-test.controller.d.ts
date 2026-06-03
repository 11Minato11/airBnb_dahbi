import { RedisService } from '../redis/redis.service';
import { PropertiesService } from '../properties/properties.service';
export declare class RedisTestController {
    private readonly redisService;
    private readonly propertiesService;
    constructor(redisService: RedisService, propertiesService: PropertiesService);
    ping(): Promise<{
        status: string;
        message: string;
        result: any;
        error?: undefined;
    } | {
        status: string;
        message: string;
        error: any;
        result?: undefined;
    }>;
    set(body: {
        key: string;
        value: any;
        ttl?: number;
    }): Promise<{
        status: string;
        message: any;
    }>;
    get(key: string): Promise<{
        status: string;
        key: string;
        value: any;
        message?: undefined;
    } | {
        status: string;
        message: any;
        key?: undefined;
        value?: undefined;
    }>;
    delete(key: string): Promise<{
        status: string;
        message: any;
    }>;
    addBookedDates(body: {
        propertyId: string;
        dates: string[];
    }): Promise<{
        status: string;
        message: any;
    }>;
    checkAvailability(body: {
        propertyId: string;
        dates: string[];
    }): Promise<{
        status: string;
        propertyId: string;
        dates: string[];
        available: boolean;
        message?: undefined;
    } | {
        status: string;
        message: any;
        propertyId?: undefined;
        dates?: undefined;
        available?: undefined;
    }>;
    acquireLock(body: {
        propertyId: string;
        ttl?: number;
    }): Promise<{
        status: string;
        propertyId: string;
        acquired: boolean;
        message?: undefined;
    } | {
        status: string;
        message: any;
        propertyId?: undefined;
        acquired?: undefined;
    }>;
    releaseLock(body: {
        propertyId: string;
    }): Promise<{
        status: string;
        message: any;
    }>;
    setRating(body: {
        propertyId: string;
        rating: number;
        count: number;
    }): Promise<{
        status: string;
        message: any;
    }>;
    getRating(propertyId: string): Promise<{
        status: string;
        propertyId: string;
        rating: {
            rating: number;
            count: number;
        } | null;
        message?: undefined;
    } | {
        status: string;
        message: any;
        propertyId?: undefined;
        rating?: undefined;
    }>;
    addReview(body: {
        propertyId: string;
        review: any;
    }): Promise<{
        status: string;
        message: any;
    }>;
    getReviews(propertyId: string): Promise<{
        status: string;
        propertyId: string;
        reviews: any[];
        message?: undefined;
    } | {
        status: string;
        message: any;
        propertyId?: undefined;
        reviews?: undefined;
    }>;
    incrementUnread(body: {
        toUserId: string;
        fromUserId: string;
        count?: number;
    }): Promise<{
        status: string;
        message: any;
    }>;
    getUnread(userId: string): Promise<{
        status: string;
        userId: string;
        unread: Record<string, number>;
        message?: undefined;
    } | {
        status: string;
        message: any;
        userId?: undefined;
        unread?: undefined;
    }>;
    testSearch(): Promise<{
        status: string;
        message: string;
        count: number;
    } | {
        status: string;
        message: any;
        count?: undefined;
    }>;
    getAllKeys(): Promise<{
        status: string;
        keysCount: any;
        keys: any;
        message?: undefined;
    } | {
        status: string;
        message: any;
        keysCount?: undefined;
        keys?: undefined;
    }>;
    flushAll(): Promise<{
        status: string;
        message: any;
    }>;
}
