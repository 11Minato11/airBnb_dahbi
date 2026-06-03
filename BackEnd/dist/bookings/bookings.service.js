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
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const reservation_schema_1 = require("../reservations/schemas/reservation.schema");
const redis_service_1 = require("../redis/redis.service");
let BookingsService = class BookingsService {
    bookingModel;
    redisService;
    constructor(bookingModel, redisService) {
        this.bookingModel = bookingModel;
        this.redisService = redisService;
    }
    async createBooking(propertyId, userId, checkInDate, checkOutDate, totalPrice) {
        const dates = this.generateDateArray(checkInDate, checkOutDate);
        const existingBooking = await this.bookingModel.findOne({
            propertyId,
            status: { $in: ['confirmed', 'pending'] },
            checkInDate,
            checkOutDate,
        }).exec();
        if (existingBooking) {
            throw new common_1.ConflictException('Une réservation avec exactement ces mêmes dates existe déjà');
        }
        const overlappingBooking = await this.bookingModel.findOne({
            propertyId,
            status: { $in: ['confirmed', 'pending'] },
            $or: [
                {
                    checkInDate: { $lt: checkOutDate },
                    checkOutDate: { $gt: checkInDate },
                },
            ],
        }).exec();
        if (overlappingBooking) {
            throw new common_1.ConflictException('Les dates demandées chevauchent une réservation existante');
        }
        const isAvailable = await this.redisService.isAvailable(propertyId, dates);
        if (!isAvailable) {
            throw new common_1.ConflictException('Les dates demandées ne sont pas disponibles');
        }
        const lockAcquired = await this.redisService.lockProperty(propertyId, 600);
        if (!lockAcquired) {
            throw new common_1.ConflictException('Une autre personne réserve cette propriété en ce moment. Veuillez réessayer.');
        }
        try {
            const booking = new this.bookingModel({
                propertyId,
                guestId: userId,
                checkInDate,
                checkOutDate,
                totalPrice,
                status: 'confirmed',
            });
            const savedBooking = await booking.save();
            await this.redisService.addBookedDates(propertyId, dates);
            await this.redisService.del(`property:detail:${propertyId}`);
            await this.redisService.unlockProperty(propertyId);
            return savedBooking;
        }
        catch (error) {
            await this.redisService.unlockProperty(propertyId);
            throw error;
        }
    }
    async findByProperty(propertyId) {
        return this.bookingModel
            .find({ propertyId, status: { $in: ['confirmed', 'pending'] } })
            .exec();
    }
    async findByGuest(guestId) {
        return this.bookingModel
            .find({ guestId })
            .populate('propertyId')
            .exec();
    }
    async findById(id) {
        const booking = await this.bookingModel.findById(id).exec();
        if (!booking) {
            throw new common_1.NotFoundException(`Booking with ID ${id} not found`);
        }
        return booking;
    }
    async cancelBooking(id, userId) {
        const booking = await this.findById(id);
        if (booking.guestId.toString() !== userId) {
            throw new common_1.ConflictException('Vous ne pouvez pas annuler une réservation qui ne vous appartient pas');
        }
        booking.status = 'cancelled';
        const updatedBooking = await booking.save();
        const dates = this.generateDateArray(booking.checkInDate, booking.checkOutDate);
        for (const date of dates) {
            await this.redisService.client.srem(`calendar:${booking.propertyId}`, date);
        }
        await this.redisService.del(`property:detail:${booking.propertyId}`);
        return updatedBooking;
    }
    generateDateArray(startDate, endDate) {
        const dates = [];
        const currentDate = new Date(startDate);
        while (currentDate < endDate) {
            dates.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(reservation_schema_1.Reservation.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        redis_service_1.RedisService])
], BookingsService);
//# sourceMappingURL=bookings.service.js.map