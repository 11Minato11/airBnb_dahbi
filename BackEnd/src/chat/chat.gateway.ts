import {
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Logger, Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);
  private connectedClients: Map<string, Socket> = new Map();

  constructor(private readonly redisService: RedisService) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;

    if (!userId) {
      this.logger.warn('Client connected without userId');
      client.disconnect();
      return;
    }

    client.data.userId = userId;
    this.connectedClients.set(userId, client);
    this.logger.log(`Client connected: userId=${userId}, socketId=${client.id}`);

    // Subscribe to Redis channel for this user
    const channel = `chat:user:${userId}`;
    this.redisService.subscriber.subscribe(channel, (err: Error | null, count: number) => {
      if (err) {
        this.logger.error(`Error subscribing to channel ${channel}:`, err);
      } else {
        this.logger.log(`Subscribed to ${count} channel(s)`);
      }
    });

    // Listen for messages on this channel
    this.redisService.subscriber.on('message', (subscribedChannel: string, message: string) => {
      if (subscribedChannel === channel) {
        try {
          const parsedMessage = JSON.parse(message);
          client.emit('new_message', parsedMessage);
        } catch (error) {
          this.logger.error(`Error parsing message from channel ${subscribedChannel}:`, error);
        }
      }
    });

    client.emit('connection', { status: 'connected', userId });
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.connectedClients.delete(userId);
      this.logger.log(`Client disconnected: userId=${userId}, socketId=${client.id}`);
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { toUserId: string; message: string },
  ) {
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
      // Save message to MongoDB (optional - for message history)
      // await this.messagesService.create(messageObject);

      // Publish to Redis for recipient
      await this.redisService.publish(`chat:user:${payload.toUserId}`, messageObject);

      // Publish to Redis for sender (confirmation)
      await this.redisService.publish(`chat:user:${fromUserId}`, {
        ...messageObject,
        status: 'sent',
      });

      // Increment unread count
      await this.redisService.incrementUnread(payload.toUserId, fromUserId, 1);

      // Emit confirmation to sender
      client.emit('message_sent', {
        toUserId: payload.toUserId,
        timestamp: messageObject.timestamp,
        status: 'sent',
      });

      this.logger.log(
        `Message sent from ${fromUserId} to ${payload.toUserId}`,
      );
    } catch (error) {
      this.logger.error('Error sending message:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { fromUserId: string },
  ) {
    const toUserId = client.data.userId;

    if (!toUserId || !payload.fromUserId) {
      client.emit('error', { message: 'Missing required fields' });
      return;
    }

    try {
      // Remove unread count for this conversation
      await this.redisService.removeUnread(toUserId, payload.fromUserId);

      client.emit('marked_as_read', { fromUserId: payload.fromUserId });

      this.logger.log(
        `Messages marked as read for ${toUserId} from ${payload.fromUserId}`,
      );
    } catch (error) {
      this.logger.error('Error marking messages as read:', error);
      client.emit('error', { message: 'Failed to mark messages as read' });
    }
  }

  @SubscribeMessage('get_unread')
  async handleGetUnread(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId;

    if (!userId) {
      client.emit('error', { message: 'User not authenticated' });
      return;
    }

    try {
      const unreadCounts = await this.redisService.getUnread(userId);
      client.emit('unread_counts', unreadCounts);

      this.logger.log(`Unread counts retrieved for ${userId}`);
    } catch (error) {
      this.logger.error('Error retrieving unread counts:', error);
      client.emit('error', { message: 'Failed to retrieve unread counts' });
    }
  }
}
