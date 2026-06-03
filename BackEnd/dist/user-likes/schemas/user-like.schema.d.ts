import { Document } from 'mongoose';
export type UserLikeDocument = UserLike & Document;
export declare class UserLike {
    userId: string;
    propertyId: string;
}
export declare const UserLikeSchema: import("mongoose").Schema<UserLike, import("mongoose").Model<UserLike, any, any, any, any, any, UserLike>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, UserLike, Document<unknown, {}, UserLike, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<UserLike & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    userId?: import("mongoose").SchemaDefinitionProperty<string, UserLike, Document<unknown, {}, UserLike, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserLike & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    propertyId?: import("mongoose").SchemaDefinitionProperty<string, UserLike, Document<unknown, {}, UserLike, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserLike & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, UserLike>;
