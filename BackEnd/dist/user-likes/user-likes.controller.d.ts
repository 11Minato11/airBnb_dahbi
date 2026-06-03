import { UserLikesService } from './user-likes.service';
export declare class UserLikesController {
    private readonly userLikesService;
    constructor(userLikesService: UserLikesService);
    getMyLikes(req: any): Promise<string[]>;
    isLiked(req: any, propertyId: string): Promise<boolean>;
    toggleLike(req: any, propertyId: string): Promise<{
        liked: boolean;
        propertyId: string;
    }>;
}
