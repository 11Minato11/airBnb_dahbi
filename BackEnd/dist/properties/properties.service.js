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
exports.PropertiesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const property_schema_1 = require("./schemas/property.schema");
const reservation_schema_1 = require("../reservations/schemas/reservation.schema");
const redis_service_1 = require("../redis/redis.service");
let PropertiesService = class PropertiesService {
    propertyModel;
    reservationModel;
    redisService;
    constructor(propertyModel, reservationModel, redisService) {
        this.propertyModel = propertyModel;
        this.reservationModel = reservationModel;
        this.redisService = redisService;
    }
    async create(createPropertyDto, hostId) {
        const newProperty = new this.propertyModel({
            ...createPropertyDto,
            hostId,
        });
        const savedProperty = await newProperty.save();
        if (createPropertyDto.address && createPropertyDto.address.city) {
            await this.redisService.delPattern(`search:${createPropertyDto.address.city}:*`);
        }
        return savedProperty;
    }
    async search(city, guests, checkIn, checkOut, minPrice, maxPrice) {
        const cacheKey = `search:${city}:${guests}:${checkIn}:${checkOut}:${minPrice}:${maxPrice}`;
        try {
            const cachedResult = await this.redisService.get(cacheKey);
            if (cachedResult) {
                return cachedResult;
            }
        }
        catch (error) {
        }
        const result = await this.findAll({
            city,
            guests,
            checkIn,
            checkOut,
            minPrice,
            maxPrice,
        });
        try {
            await this.redisService.set(cacheKey, result, 300);
        }
        catch (error) {
        }
        return result;
    }
    async findAll(query) {
        const filter = { isActive: true };
        if (query.city) {
            filter['address.city'] = { $regex: new RegExp(query.city, 'i') };
        }
        if (query.guests) {
            filter.maxGuests = { $gte: parseInt(query.guests, 10) };
        }
        if (query.checkIn && query.checkOut) {
            const checkInDate = new Date(query.checkIn);
            const checkOutDate = new Date(query.checkOut);
            const activeReservations = await this.reservationModel.find({
                status: { $in: ['confirmed', 'pending'] },
                $or: [
                    { checkInDate: { $lt: checkOutDate }, checkOutDate: { $gt: checkInDate } }
                ]
            }).select('propertyId').exec();
            const reservedPropertyIds = activeReservations.map(res => res.propertyId);
            filter._id = { $nin: reservedPropertyIds };
        }
        if (query.lng && query.lat && query.maxDistance) {
            filter.location = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(query.lng), parseFloat(query.lat)],
                    },
                    $maxDistance: parseInt(query.maxDistance, 10),
                },
            };
        }
        return this.propertyModel.find(filter).exec();
    }
    async findOne(id) {
        const cacheKey = `property:detail:${id}`;
        try {
            const cachedProperty = await this.redisService.get(cacheKey);
            if (cachedProperty) {
                return cachedProperty;
            }
        }
        catch (error) {
        }
        const property = await this.propertyModel
            .findById(id)
            .populate('hostId')
            .exec();
        if (!property) {
            throw new common_1.NotFoundException(`Property with ID ${id} not found`);
        }
        try {
            await this.redisService.set(cacheKey, property, 1800);
        }
        catch (error) {
        }
        return property;
    }
    async findByHost(hostId) {
        return this.propertyModel.find({ hostId }).exec();
    }
    async update(id, updateData) {
        const updatedProperty = await this.propertyModel
            .findByIdAndUpdate(id, updateData, { new: true })
            .exec();
        if (!updatedProperty) {
            throw new common_1.NotFoundException(`Property with ID ${id} not found`);
        }
        await this.redisService.del(`property:detail:${id}`);
        await this.redisService.delPattern('search:*');
        return updatedProperty;
    }
    async remove(id, hostId) {
        const property = await this.findOne(id);
        if (property.hostId.toString() !== hostId) {
            throw new common_1.NotFoundException('Vous n\'êtes pas le propriétaire de ce logement.');
        }
        await this.propertyModel.findByIdAndDelete(id).exec();
        await this.redisService.del(`property:detail:${id}`);
        await this.redisService.delPattern('search:*');
        return { deleted: true };
    }
};
exports.PropertiesService = PropertiesService;
exports.PropertiesService = PropertiesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(property_schema_1.Property.name)),
    __param(1, (0, mongoose_1.InjectModel)(reservation_schema_1.Reservation.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        redis_service_1.RedisService])
], PropertiesService);
//# sourceMappingURL=properties.service.js.map