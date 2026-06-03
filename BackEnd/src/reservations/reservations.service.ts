import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reservation, ReservationDocument } from './schemas/reservation.schema';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { PropertiesService } from '../properties/properties.service';
import { BookingsService } from '../bookings/bookings.service';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectModel(Reservation.name) private reservationModel: Model<ReservationDocument>,
    private propertiesService: PropertiesService,
    private bookingsService: BookingsService,
  ) {}

  async create(createReservationDto: CreateReservationDto, guestId: string): Promise<ReservationDocument> {
    const { propertyId, checkInDate, checkOutDate, totalPrice } = createReservationDto;

    // 1. Vérifier si la propriété existe
    await this.propertiesService.findOne(propertyId);

    // 2. Utiliser BookingsService avec validation complète (dates exactes, chevauchement, Redis)
    const booking = await this.bookingsService.createBooking(
      propertyId,
      guestId,
      new Date(checkInDate),
      new Date(checkOutDate),
      totalPrice || 0,
    );

    return booking;
  }

  async findMyTrips(guestId: string): Promise<ReservationDocument[]> {
    return this.reservationModel.find({ guestId }).populate('propertyId').exec();
  }
}
