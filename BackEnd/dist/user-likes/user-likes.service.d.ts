import { Model } from 'mongoose';
import { UserLikeDocument } from './schemas/user-like.schema';
export declare class UserLikesService {
    private readonly userLikeModel;
    constructor(userLikeModel: Model<UserLikeDocument>);
    toggleLike(userId: string, propertyId: string): Promise<{
        liked: boolean;
        propertyId: string;
    }>;
    getLikedPropertyIds(userId: string): Promise<string[]>;
    isLiked(userId: string, propertyId: string): Promise<boolean>;
}
