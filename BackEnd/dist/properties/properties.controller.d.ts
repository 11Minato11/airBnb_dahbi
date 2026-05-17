import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
export declare class PropertiesController {
    private readonly propertiesService;
    constructor(propertiesService: PropertiesService);
    create(createPropertyDto: CreatePropertyDto, req: any): Promise<import("./schemas/property.schema").PropertyDocument>;
    findMyListings(req: any): Promise<import("./schemas/property.schema").PropertyDocument[]>;
    remove(id: string, req: any): Promise<{
        deleted: boolean;
    }>;
    findAll(query: any): Promise<import("./schemas/property.schema").PropertyDocument[]>;
    findOne(id: string): Promise<import("./schemas/property.schema").PropertyDocument>;
}
