import mongoose, { Document } from 'mongoose';
export type ConversationDocument = Conversation & Document;
export declare class Conversation {
    propertyId: string;
    guestId: string;
    hostId: string;
    lastMessage: string;
    lastMessageAt: Date;
}
export declare const ConversationSchema: mongoose.Schema<Conversation, mongoose.Model<Conversation, any, any, any, any, any, Conversation>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, Conversation, mongoose.Document<unknown, {}, Conversation, {
    id: string;
}, mongoose.DefaultSchemaOptions> & Omit<Conversation & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    propertyId?: mongoose.SchemaDefinitionProperty<string, Conversation, mongoose.Document<unknown, {}, Conversation, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<Conversation & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    guestId?: mongoose.SchemaDefinitionProperty<string, Conversation, mongoose.Document<unknown, {}, Conversation, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<Conversation & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    hostId?: mongoose.SchemaDefinitionProperty<string, Conversation, mongoose.Document<unknown, {}, Conversation, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<Conversation & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lastMessage?: mongoose.SchemaDefinitionProperty<string, Conversation, mongoose.Document<unknown, {}, Conversation, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<Conversation & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lastMessageAt?: mongoose.SchemaDefinitionProperty<Date, Conversation, mongoose.Document<unknown, {}, Conversation, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<Conversation & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Conversation>;
