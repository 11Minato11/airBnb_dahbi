import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { Reservation, ReservationSchema } from './schemas/reservation.schema';
import { PropertiesModule } from '../properties/properties.module';
import { AuthModule } from '../auth/auth.module';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: Reservation.name, schema: ReservationSchema }]),
    PropertiesModule, // Nécessaire pour vérifier la disponibilité
    BookingsModule, // Nécessaire pour validation complète (dates exactes, chevauchement, Redis)
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService],
})
export class ReservationsModule {}
