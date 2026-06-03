"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ChatGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../redis/redis.service");
let ChatGateway = ChatGateway_1 = class ChatGateway {
    redisService;
    logger = new common_1.Logger(ChatGateway_1.name);
    connectedClients = new Map();
    constructor(redisService) {
        this.redisService = redisService;
    }
    handleConnection(client) {
        const userId = client.handshake.query.userId;
        if (!userId) {
            this.logger.warn('Client connected without userId');
            client.disconnect();
            return;
        }
        client.data.userId = userId;
        this.connectedClients.set(userId, client);
        this.logger.log(`Client connected: userId=${userId}, socketId=${client.id}`);
        const channel = `chat:user:${userId}`;
        this.redisService.subscriber.subscribe(channel, (err, count) => {
            if (err) {
                this.logger.error(`Error subscribing to channel ${channel}:`, err);
            }
            else {
                this.logger.log(`Subscribed to ${count} channel(s)`);
            }
        });
        this.redisService.subscriber.on('message', (subscribedChannel, message) => {
            if (subscribedChannel === channel) {
                try {
                    const parsedMessage = JSON.parse(message);
                    client.emit('new_message', parsedMessage);
                }
                catch (error) {
                    this.logger.error(`Error parsing message from channel ${subscribedChannel}:`, error);
                }
            }
        });
        client.emit('connection', { status: 'connected', userId });
    }
    handleDisconnect(client) {
        const userId = client.data.userId;
        if (userId) {
            this.connectedClients.delete(userId);
            this.logger.log(`Client disconnected: userId=${userId}, socketId=${client.id}`);
        }
    }
    async handleSendMessage(client, payload) {
        const fromUserId = client.data.userId;
        if (!fromUserId || !payload.toUserId || !payload.message) {
            client.emit('error', { message: 'Missing required fields' });
            return;
        }
        const messageObject = {
            fromUserId,
            toUserId: payload.toUserId,
            message: payload.message,
            timestamp: new Date(),
            read: false,
        };
        try {
            await this.redisService.publish(`chat:user:${payload.toUserId}`, messageObject);
            await this.redisService.publish(`chat:user:${fromUserId}`, {
                ...messageObject,
                status: 'sent',
            });
            await this.redisService.incrementUnread(payload.toUserId, fromUserId, 1);
            client.emit('message_sent', {
                toUserId: payload.toUserId,
                timestamp: messageObject.timestamp,
                status: 'sent',
            });
            this.logger.log(`Message sent from ${fromUserId} to ${payload.toUserId}`);
        }
        catch (error) {
            this.logger.error('Error sending message:', error);
            client.emit('error', { message: 'Failed to send message' });
        }
    }
    async handleMarkAsRead(client, payload) {
        const toUserId = client.data.userId;
        if (!toUserId || !payload.fromUserId) {
            client.emit('error', { message: 'Missing required fields' });
            return;
        }
        try {
            await this.redisService.removeUnread(toUserId, payload.fromUserId);
            client.emit('marked_as_read', { fromUserId: payload.fromUserId });
            this.logger.log(`Messages marked as read for ${toUserId} from ${payload.fromUserId}`);
        }
        catch (error) {
            this.logger.error('Error marking messages as read:', error);
            client.emit('error', { message: 'Failed to mark messages as read' });
        }
    }
    async handleGetUnread(client) {
        const userId = client.data.userId;
        if (!userId) {
            client.emit('error', { message: 'User not authenticated' });
            return;
        }
        try {
            const unreadCounts = await this.redisService.getUnread(userId);
            client.emit('unread_counts', unreadCounts);
            this.logger.log(`Unread counts retrieved for ${userId}`);
        }
        catch (error) {
            this.logger.error('Error retrieving unread counts:', error);
            client.emit('error', { message: 'Failed to retrieve unread counts' });
        }
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.SubscribeMessage)('send_message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('mark_as_read'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMarkAsRead", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('get_unread'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleGetUnread", null);
exports.ChatGateway = ChatGateway = ChatGateway_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({ cors: { origin: '*' } }),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map