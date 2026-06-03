import { Model } from 'mongoose';
import { ConversationDocument } from './schemas/conversation.schema';
import { MessageDocument } from './schemas/message.schema';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
export declare class MessagesService {
    private conversationModel;
    private messageModel;
    constructor(conversationModel: Model<ConversationDocument>, messageModel: Model<MessageDocument>);
    findOrCreateConversation(dto: CreateConversationDto, guestId: string): Promise<ConversationDocument>;
    getConversations(userId: string): Promise<any[]>;
    getMessages(conversationId: string, userId: string): Promise<MessageDocument[]>;
    sendMessage(dto: CreateMessageDto, senderId: string): Promise<MessageDocument>;
    getTotalUnread(userId: string): Promise<number>;
}
