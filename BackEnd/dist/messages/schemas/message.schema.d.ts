import mongoose, { Document } from 'mongoose';
export type MessageDocument = Message & Document;
export declare class Message {
    conversationId: string;
    senderId: string;
    content: string;
    read: boolean;
}
export declare const MessageSchema: mongoose.Schema<Message, mongoose.Model<Message, any, any, any, any, any, Message>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, Message, mongoose.Document<unknown, {}, Message, {
    id: string;
}, mongoose.DefaultSchemaOptions> & Omit<Message & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    conversationId?: mongoose.SchemaDefinitionProperty<string, Message, mongoose.Document<unknown, {}, Message, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<Message & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    senderId?: mongoose.SchemaDefinitionProperty<string, Message, mongoose.Document<unknown, {}, Message, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<Message & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    content?: mongoose.SchemaDefinitionProperty<string, Message, mongoose.Document<unknown, {}, Message, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<Message & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    read?: mongoose.SchemaDefinitionProperty<boolean, Message, mongoose.Document<unknown, {}, Message, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<Message & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Message>;
