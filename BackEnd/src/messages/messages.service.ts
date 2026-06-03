import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from './schemas/conversation.schema';
import { Message, MessageDocument } from './schemas/message.schema';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  async findOrCreateConversation(dto: CreateConversationDto, guestId: string): Promise<ConversationDocument> {
    const existing = await this.conversationModel.findOne({
      propertyId: dto.propertyId,
      guestId,
    });

    if (existing) return existing;

    return this.conversationModel.create({
      propertyId: dto.propertyId,
      hostId: dto.hostId,
      guestId,
    });
  }

  async getConversations(userId: string): Promise<any[]> {
    const conversations = await this.conversationModel
      .find({ $or: [{ hostId: userId }, { guestId: userId }] })
      .populate('propertyId', 'title imageUrl address')
      .populate('hostId', 'firstName lastName')
      .populate('guestId', 'firstName lastName')
      .sort({ lastMessageAt: -1 })
      .exec();

    const results = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await this.messageModel.countDocuments({
          conversationId: conv._id,
          senderId: { $ne: new Types.ObjectId(userId) },
          read: false,
        } as any);
        return { ...conv.toObject(), unreadCount };
      }),
    );

    return results;
  }

  async getMessages(conversationId: string, userId: string): Promise<MessageDocument[]> {
    const conv = await this.conversationModel.findById(conversationId).exec();
    if (!conv) throw new NotFoundException('Conversation introuvable');
    if (conv.hostId.toString() !== userId && conv.guestId.toString() !== userId) {
      throw new NotFoundException('Conversation introuvable');
    }

    await this.messageModel.updateMany(
      { conversationId, senderId: { $ne: new Types.ObjectId(userId) }, read: false } as any,
      { read: true },
    );

    return this.messageModel
      .find({ conversationId })
      .populate('senderId', 'firstName lastName')
      .sort({ createdAt: 1 })
      .exec();
  }

  async sendMessage(dto: CreateMessageDto, senderId: string): Promise<MessageDocument> {
    const conv = await this.conversationModel.findById(dto.conversationId).exec();
    if (!conv) throw new NotFoundException('Conversation introuvable');
    if (conv.hostId.toString() !== senderId && conv.guestId.toString() !== senderId) {
      throw new NotFoundException('Conversation introuvable');
    }

    const message = await this.messageModel.create({
      conversationId: dto.conversationId,
      senderId,
      content: dto.content,
    });

    await this.conversationModel.findByIdAndUpdate(dto.conversationId, {
      lastMessage: dto.content.substring(0, 100),
      lastMessageAt: new Date(),
    });

    return message.populate('senderId', 'firstName lastName');
  }

  async getTotalUnread(userId: string): Promise<number> {
    const conversations = await this.conversationModel
      .find({ $or: [{ hostId: userId }, { guestId: userId }] })
      .select('_id')
      .exec();

    const convIds = conversations.map((c) => c._id);

    return this.messageModel.countDocuments({
      conversationId: { $in: convIds },
      senderId: { $ne: new Types.ObjectId(userId) },
      read: false,
    } as any);
  }
}
