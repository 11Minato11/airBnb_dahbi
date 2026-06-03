import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { RedisService } from '../redis/redis.service';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly redisService;
    private readonly logger;
    private connectedClients;
    constructor(redisService: RedisService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleSendMessage(client: Socket, payload: {
        toUserId: string;
        message: string;
    }): Promise<void>;
    handleMarkAsRead(client: Socket, payload: {
        fromUserId: string;
    }): Promise<void>;
    handleGetUnread(client: Socket): Promise<void>;
}
