import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserLike, UserLikeDocument } from './schemas/user-like.schema';

@Injectable()
export class UserLikesService {
  constructor(@InjectModel(UserLike.name) private readonly userLikeModel: Model<UserLikeDocument>) {}

  async toggleLike(userId: string, propertyId: string): Promise<{ liked: boolean; propertyId: string }> {
    const existingLike = await this.userLikeModel.findOne({ userId, propertyId }).exec();

    if (existingLike) {
      await existingLike.deleteOne();
      return { liked: false, propertyId };
    }

    await this.userLikeModel.create({ userId, propertyId });
    return { liked: true, propertyId };
  }

  async getLikedPropertyIds(userId: string): Promise<string[]> {
    const likes = await this.userLikeModel.find({ userId }).select('propertyId -_id').lean().exec();
    return likes.map((like) => like.propertyId);
  }

  async isLiked(userId: string, propertyId: string): Promise<boolean> {
    const like = await this.userLikeModel.findOne({ userId, propertyId }).lean().exec();
    return !!like;
  }
}
