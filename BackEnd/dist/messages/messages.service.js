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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const conversation_schema_1 = require("./schemas/conversation.schema");
const message_schema_1 = require("./schemas/message.schema");
let MessagesService = class MessagesService {
    conversationModel;
    messageModel;
    constructor(conversationModel, messageModel) {
        this.conversationModel = conversationModel;
        this.messageModel = messageModel;
    }
    async findOrCreateConversation(dto, guestId) {
        const existing = await this.conversationModel.findOne({
            propertyId: dto.propertyId,
            guestId,
        });
        if (existing)
            return existing;
        return this.conversationModel.create({
            propertyId: dto.propertyId,
            hostId: dto.hostId,
            guestId,
        });
    }
    async getConversations(userId) {
        const conversations = await this.conversationModel
            .find({ $or: [{ hostId: userId }, { guestId: userId }] })
            .populate('propertyId', 'title imageUrl address')
            .populate('hostId', 'firstName lastName')
            .populate('guestId', 'firstName lastName')
            .sort({ lastMessageAt: -1 })
            .exec();
        const results = await Promise.all(conversations.map(async (conv) => {
            const unreadCount = await this.messageModel.countDocuments({
                conversationId: conv._id,
                senderId: { $ne: new mongoose_2.Types.ObjectId(userId) },
                read: false,
            });
            return { ...conv.toObject(), unreadCount };
        }));
        return results;
    }
    async getMessages(conversationId, userId) {
        const conv = await this.conversationModel.findById(conversationId).exec();
        if (!conv)
            throw new common_1.NotFoundException('Conversation introuvable');
        if (conv.hostId.toString() !== userId && conv.guestId.toString() !== userId) {
            throw new common_1.NotFoundException('Conversation introuvable');
        }
        await this.messageModel.updateMany({ conversationId, senderId: { $ne: new mongoose_2.Types.ObjectId(userId) }, read: false }, { read: true });
        return this.messageModel
            .find({ conversationId })
            .populate('senderId', 'firstName lastName')
            .sort({ createdAt: 1 })
            .exec();
    }
    async sendMessage(dto, senderId) {
        const conv = await this.conversationModel.findById(dto.conversationId).exec();
        if (!conv)
            throw new common_1.NotFoundException('Conversation introuvable');
        if (conv.hostId.toString() !== senderId && conv.guestId.toString() !== senderId) {
            throw new common_1.NotFoundException('Conversation introuvable');
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
    async getTotalUnread(userId) {
        const conversations = await this.conversationModel
            .find({ $or: [{ hostId: userId }, { guestId: userId }] })
            .select('_id')
            .exec();
        const convIds = conversations.map((c) => c._id);
        return this.messageModel.countDocuments({
            conversationId: { $in: convIds },
            senderId: { $ne: new mongoose_2.Types.ObjectId(userId) },
            read: false,
        });
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(conversation_schema_1.Conversation.name)),
    __param(1, (0, mongoose_1.InjectModel)(message_schema_1.Message.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], MessagesService);
//# sourceMappingURL=messages.service.js.map