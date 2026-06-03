import { Injectable, ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reservation, ReservationDocument } from '../reservations/schemas/reservation.schema';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Reservation.name) private bookingModel: Model<ReservationDocument>,
    private readonly redisService: RedisService,
  ) {}

  async createBooking(
    propertyId: string,
    userId: string,
    checkInDate: Date,
    checkOutDate: Date,
    totalPrice: number,
  ): Promise<ReservationDocument> {
    // Generate date array for Redis operations
    const dates = this.generateDateArray(checkInDate, checkOutDate);

    // Step 1: Check if exact same dates reservation already exists in MongoDB
    const existingBooking = await this.bookingModel.findOne({
      propertyId,
      status: { $in: ['confirmed', 'pending'] },
      checkInDate,
      checkOutDate,
    }).exec();

    if (existingBooking) {
      throw new ConflictException('Une réservation avec exactement ces mêmes dates existe déjà');
    }

    // Step 1b: Check for overlapping reservations in MongoDB
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
      throw new ConflictException('Les dates demandées chevauchent une réservation existante');
    }

    // Step 2: Check availability in Redis
    const isAvailable = await this.redisService.isAvailable(propertyId, dates);
    if (!isAvailable) {
      throw new ConflictException('Les dates demandées ne sont pas disponibles');
    }

    // Step 3: Acquire lock
    const lockAcquired = await this.redisService.lockProperty(propertyId, 600);
    if (!lockAcquired) {
      throw new ConflictException('Une autre personne réserve cette propriété en ce moment. Veuillez réessayer.');
    }

    try {
      // Step 4: Create booking in MongoDB
      const booking = new this.bookingModel({
        propertyId,
        guestId: userId,
        checkInDate,
        checkOutDate,
        totalPrice,
        status: 'confirmed',
      });

      const savedBooking = await booking.save();

      // Step 5: Add booked dates to Redis
      await this.redisService.addBookedDates(propertyId, dates);

      // Step 6: Invalidate property detail cache
      await this.redisService.del(`property:detail:${propertyId}`);

      // Step 7: Release lock
      await this.redisService.unlockProperty(propertyId);

      return savedBooking;
    } catch (error) {
      // Ensure lock is released on error
      await this.redisService.unlockProperty(propertyId);
      throw error;
    }
  }

  async findByProperty(propertyId: string): Promise<ReservationDocument[]> {
    return this.bookingModel
      .find({ propertyId, status: { $in: ['confirmed', 'pending'] } })
      .exec();
  }

  async findByGuest(guestId: string): Promise<ReservationDocument[]> {
    return this.bookingModel
      .find({ guestId })
      .populate('propertyId')
      .exec();
  }

  async findById(id: string): Promise<ReservationDocument> {
    const booking = await this.bookingModel.findById(id).exec();
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }
    return booking;
  }

  async cancelBooking(id: string, userId: string): Promise<ReservationDocument> {
    const booking = await this.findById(id);

    if (booking.guestId.toString() !== userId) {
      throw new ConflictException('Vous ne pouvez pas annuler une réservation qui ne vous appartient pas');
    }

    // Update status to cancelled
    booking.status = 'cancelled';
    const updatedBooking = await booking.save();

    // Free up the booked dates in Redis
    const dates = this.generateDateArray(booking.checkInDate, booking.checkOutDate);
    for (const date of dates) {
      await this.redisService.client.srem(`calendar:${booking.propertyId}`, date);
    }

    // Invalidate property detail cache
    await this.redisService.del(`property:detail:${booking.propertyId}`);

    return updatedBooking;
  }

  // Helper method to generate array of dates between two dates
  private generateDateArray(startDate: Date, endDate: Date): string[] {
    const dates: string[] = [];
    const currentDate = new Date(startDate);

    while (currentDate < endDate) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }
}
