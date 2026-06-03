import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Property, PropertyDocument } from './schemas/property.schema';
import { Reservation, ReservationDocument } from '../reservations/schemas/reservation.schema';
import { CreatePropertyDto } from './dto/create-property.dto';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectModel(Property.name) private propertyModel: Model<PropertyDocument>,
    @InjectModel(Reservation.name) private reservationModel: Model<ReservationDocument>,
    private readonly redisService: RedisService,
  ) {}

  async create(createPropertyDto: CreatePropertyDto, hostId: string): Promise<PropertyDocument> {
    const newProperty = new this.propertyModel({
      ...createPropertyDto,
      hostId,
    });
    const savedProperty = await newProperty.save();

    // Invalidate search cache for this city
    if (createPropertyDto.address && createPropertyDto.address.city) {
      await this.redisService.delPattern(`search:${createPropertyDto.address.city}:*`);
    }

    return savedProperty;
  }

  async search(
    city: string,
    guests: number,
    checkIn: string,
    checkOut: string,
    minPrice: number,
    maxPrice: number,
  ): Promise<PropertyDocument[]> {
    // Build cache key
    const cacheKey = `search:${city}:${guests}:${checkIn}:${checkOut}:${minPrice}:${maxPrice}`;

    try {
      // Try to get from Redis first
      const cachedResult = await this.redisService.get(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }
    } catch (error) {
      // If Redis fails, continue to MongoDB query
    }

    // Query MongoDB
    const result = await this.findAll({
      city,
      guests,
      checkIn,
      checkOut,
      minPrice,
      maxPrice,
    });

    // Store in Redis (TTL: 300 seconds = 5 minutes)
    try {
      await this.redisService.set(cacheKey, result, 300);
    } catch (error) {
      // If Redis fails, still return the result
    }

    return result;
  }

  async findAll(query: any): Promise<PropertyDocument[]> {
    const filter: any = { isActive: true };

    // Filtre par ville
    if (query.city) {
      filter['address.city'] = { $regex: new RegExp(query.city, 'i') };
    }

    // Filtre par capacité de voyageurs
    if (query.guests) {
      filter.maxGuests = { $gte: parseInt(query.guests, 10) };
    }

    // Filtre par disponibilité des dates
    if (query.checkIn && query.checkOut) {
      const checkInDate = new Date(query.checkIn);
      const checkOutDate = new Date(query.checkOut);

      // Trouver toutes les réservations actives qui se chevauchent avec ces dates
      const activeReservations = await this.reservationModel.find({
        status: { $in: ['confirmed', 'pending'] },
        $or: [
          { checkInDate: { $lt: checkOutDate }, checkOutDate: { $gt: checkInDate } }
        ]
      }).select('propertyId').exec();

      const reservedPropertyIds = activeReservations.map(res => res.propertyId);
      filter._id = { $nin: reservedPropertyIds };
    }

    // Filtre par coordonnées géospatiales (near)
    if (query.lng && query.lat && query.maxDistance) {
      filter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(query.lng), parseFloat(query.lat)],
          },
          $maxDistance: parseInt(query.maxDistance, 10), // en mètres
        },
      };
    }

    return this.propertyModel.find(filter).exec();
  }

  async findOne(id: string): Promise<PropertyDocument> {
    const cacheKey = `property:detail:${id}`;

    try {
      // Try to get from Redis first
      const cachedProperty = await this.redisService.get(cacheKey);
      if (cachedProperty) {
        return cachedProperty;
      }
    } catch (error) {
      // If Redis fails, continue to MongoDB query
    }

    // Query MongoDB with populate
    const property = await this.propertyModel
      .findById(id)
      .populate('hostId')
      .exec();

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    // Store in Redis (TTL: 1800 seconds = 30 minutes)
    try {
      await this.redisService.set(cacheKey, property, 1800);
    } catch (error) {
      // If Redis fails, still return the property
    }

    return property;
  }

  async findByHost(hostId: string): Promise<PropertyDocument[]> {
    return this.propertyModel.find({ hostId }).exec();
  }

  async update(id: string, updateData: any): Promise<PropertyDocument> {
    const updatedProperty = await this.propertyModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedProperty) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    // Invalidate caches
    await this.redisService.del(`property:detail:${id}`);
    await this.redisService.delPattern('search:*');

    return updatedProperty;
  }

  async remove(id: string, hostId: string): Promise<{ deleted: boolean }> {
    const property = await this.findOne(id);
    if (property.hostId.toString() !== hostId) {
      throw new NotFoundException('Vous n\'êtes pas le propriétaire de ce logement.');
    }
    await this.propertyModel.findByIdAndDelete(id).exec();
    
    // Invalidate caches
    await this.redisService.del(`property:detail:${id}`);
    await this.redisService.delPattern('search:*');
    
    return { deleted: true };
  }
}
