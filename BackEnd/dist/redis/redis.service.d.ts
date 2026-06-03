export declare class RedisService {
    private readonly logger;
    client: any;
    subscriber: any;
    constructor();
    get(key: string): Promise<any>;
    set(key: string, value: any, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    delPattern(pattern: string): Promise<void>;
    addBookedDates(propertyId: string, dates: string[]): Promise<void>;
    isAvailable(propertyId: string, dates: string[]): Promise<boolean>;
    lockProperty(propertyId: string, ttlSeconds?: number): Promise<boolean>;
    unlockProperty(propertyId: string): Promise<void>;
    setRating(propertyId: string, rating: number, count: number): Promise<void>;
    getRating(propertyId: string): Promise<{
        rating: number;
        count: number;
    } | null>;
    addReview(propertyId: string, review: any): Promise<void>;
    getReviews(propertyId: string): Promise<any[]>;
    publish(channel: string, message: any): Promise<void>;
    subscribe(channel: string, callback: (message: any) => void): Promise<void>;
    incrementUnread(toUserId: string, fromUserId: string, count?: number): Promise<void>;
    removeUnread(toUserId: string, fromUserId: string): Promise<void>;
    getUnread(toUserId: string): Promise<Record<string, number>>;
    onModuleDestroy(): Promise<void>;
    private useInMemoryFallback;
}
