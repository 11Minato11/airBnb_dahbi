import { Model } from 'mongoose';
import { PropertyDocument } from './schemas/property.schema';
import { CreatePropertyDto } from './dto/create-property.dto';
export declare class PropertiesService {
    private propertyModel;
    constructor(propertyModel: Model<PropertyDocument>);
    create(createPropertyDto: CreatePropertyDto, hostId: string): Promise<PropertyDocument>;
    findAll(query: any): Promise<PropertyDocument[]>;
    findOne(id: string): Promise<PropertyDocument>;
    findByHost(hostId: string): Promise<PropertyDocument[]>;
    remove(id: string, hostId: string): Promise<{
        deleted: boolean;
    }>;
}
