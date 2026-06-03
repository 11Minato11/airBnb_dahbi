import { Model } from 'mongoose';
import { PropertyDocument } from './schemas/property.schema';
import { ReservationDocument } from '../reservations/schemas/reservation.schema';
import { CreatePropertyDto } from './dto/create-property.dto';
import { RedisService } from '../redis/redis.service';
export declare class PropertiesService {
    private propertyModel;
    private reservationModel;
    private readonly redisService;
    constructor(propertyModel: Model<PropertyDocument>, reservationModel: Model<ReservationDocument>, redisService: RedisService);
    create(createPropertyDto: CreatePropertyDto, hostId: string): Promise<PropertyDocument>;
    search(city: string, guests: number, checkIn: string, checkOut: string, minPrice: number, maxPrice: number): Promise<PropertyDocument[]>;
    findAll(query: any): Promise<PropertyDocument[]>;
    findOne(id: string): Promise<PropertyDocument>;
    findByHost(hostId: string): Promise<PropertyDocument[]>;
    update(id: string, updateData: any): Promise<PropertyDocument>;
    remove(id: string, hostId: string): Promise<{
        deleted: boolean;
    }>;
}
