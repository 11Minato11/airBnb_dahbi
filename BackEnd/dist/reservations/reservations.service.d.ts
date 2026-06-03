import { Model } from 'mongoose';
import { ReservationDocument } from './schemas/reservation.schema';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { PropertiesService } from '../properties/properties.service';
import { BookingsService } from '../bookings/bookings.service';
export declare class ReservationsService {
    private reservationModel;
    private propertiesService;
    private bookingsService;
    constructor(reservationModel: Model<ReservationDocument>, propertiesService: PropertiesService, bookingsService: BookingsService);
    create(createReservationDto: CreateReservationDto, guestId: string): Promise<ReservationDocument>;
    findMyTrips(guestId: string): Promise<ReservationDocument[]>;
}
