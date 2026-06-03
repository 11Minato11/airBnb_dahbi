import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserLikeDocument = UserLike & Document;

@Schema({ timestamps: true, collection: 'user_likes' })
export class UserLike {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  propertyId: string;
}

export const UserLikeSchema = SchemaFactory.createForClass(UserLike);
UserLikeSchema.index({ userId: 1, propertyId: 1 }, { unique: true });
