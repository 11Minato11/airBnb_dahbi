import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true })
  propertyId: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  guestId: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  hostId: string;

  @Prop({ default: '' })
  lastMessage: string;

  @Prop({ default: Date.now })
  lastMessageAt: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
ConversationSchema.index({ hostId: 1 });
ConversationSchema.index({ guestId: 1 });
ConversationSchema.index({ propertyId: 1, guestId: 1 }, { unique: true });
