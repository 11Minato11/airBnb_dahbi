import { MessagesService } from './messages.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
export declare class MessagesController {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    createConversation(dto: CreateConversationDto, req: any): Promise<import("./schemas/conversation.schema").ConversationDocument>;
    getConversations(req: any): Promise<any[]>;
    getMessages(id: string, req: any): Promise<import("./schemas/message.schema").MessageDocument[]>;
    sendMessage(dto: CreateMessageDto, req: any): Promise<import("./schemas/message.schema").MessageDocument>;
    getUnreadCount(req: any): Promise<number>;
}
