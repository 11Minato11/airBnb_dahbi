import mongoose, { Document } from 'mongoose';
export type PropertyDocument = Property & Document;
export declare class Property {
    hostId: string;
    title: string;
    description: string;
    pricePerNight: number;
    maxGuests: number;
    location: {
        type: string;
        coordinates: number[];
    };
    address: {
        city: string;
        country: string;
    };
    amenities: string[];
    imageUrl?: string;
    isActive: boolean;
}
export declare const PropertySchema: mongoose.Schema<Property, mongoose.Model<Property, any, any, any, any, any, Property>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, Property, mongoose.Document<unknown, {}, Property, {
    id: string;
}, mongoose.DefaultSchemaOptions> & Omit<Property & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    hostId?: mongoose.SchemaDefinitionProperty<string, Property, mongoose.Document<unknown, {}, Property, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<Property & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    title?: mongoose.SchemaDefinitionProperty<string, Property, mongoose.Document<unknown, {}, Property, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<Property & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    description?: mongoose.SchemaDefinitionProperty<string, Property, mongoose.Document<unknown, {}, Property, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<Property & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    pricePerNight?: mongoose.SchemaDefinitionProperty<number, Property, mongoose.Document<unknown, {}, Property, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<Property & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    maxGuests?: mongoose.SchemaDefinitionProperty<number, Property, mongoose.Document<unknown, {}, Property, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<Property & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    location?: mongoose.SchemaDefinitionProperty<{
        type: string;
        coordinates: number[];
    }, Property, mongoose.Document<unknown, {}, Property, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<Property & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    address?: mongoose.SchemaDefinitionProperty<{
        city: string;
        country: string;
    }, Property, mongoose.Document<unknown, {}, Property, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<Property & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    amenities?: mongoose.SchemaDefinitionProperty<string[], Property, mongoose.Document<unknown, {}, Property, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<Property & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    imageUrl?: mongoose.SchemaDefinitionProperty<string | undefined, Property, mongoose.Document<unknown, {}, Property, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<Property & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isActive?: mongoose.SchemaDefinitionProperty<boolean, Property, mongoose.Document<unknown, {}, Property, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<Property & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Property>;
