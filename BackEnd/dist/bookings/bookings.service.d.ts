import { Model } from 'mongoose';
import { ReservationDocument } from '../reservations/schemas/reservation.schema';
import { RedisService } from '../redis/redis.service';
export declare class BookingsService {
    private bookingModel;
    private readonly redisService;
    constructor(bookingModel: Model<ReservationDocument>, redisService: RedisService);
    createBooking(propertyId: string, userId: string, checkInDate: Date, checkOutDate: Date, totalPrice: number): Promise<ReservationDocument>;
    findByProperty(propertyId: string): Promise<ReservationDocument[]>;
    findByGuest(guestId: string): Promise<ReservationDocument[]>;
    findById(id: string): Promise<ReservationDocument>;
    cancelBooking(id: string, userId: string): Promise<ReservationDocument>;
    private generateDateArray;
}
