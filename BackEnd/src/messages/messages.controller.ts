import { Controller, Post, Get, Body, UseGuards, Request, Param } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @UseGuards(JwtAuthGuard)
  @Post('conversations')
  createConversation(@Body() dto: CreateConversationDto, @Request() req: any) {
    return this.messagesService.findOrCreateConversation(dto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('conversations')
  getConversations(@Request() req: any) {
    return this.messagesService.getConversations(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('conversations/:id/messages')
  getMessages(@Param('id') id: string, @Request() req: any) {
    return this.messagesService.getMessages(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('messages')
  sendMessage(@Body() dto: CreateMessageDto, @Request() req: any) {
    return this.messagesService.sendMessage(dto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('messages/unread')
  getUnreadCount(@Request() req: any) {
    return this.messagesService.getTotalUnread(req.user.userId);
  }
}
