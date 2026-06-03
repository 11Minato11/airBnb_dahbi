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
exports.ReservationsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const reservation_schema_1 = require("./schemas/reservation.schema");
const properties_service_1 = require("../properties/properties.service");
const bookings_service_1 = require("../bookings/bookings.service");
let ReservationsService = class ReservationsService {
    reservationModel;
    propertiesService;
    bookingsService;
    constructor(reservationModel, propertiesService, bookingsService) {
        this.reservationModel = reservationModel;
        this.propertiesService = propertiesService;
        this.bookingsService = bookingsService;
    }
    async create(createReservationDto, guestId) {
        const { propertyId, checkInDate, checkOutDate, totalPrice } = createReservationDto;
        await this.propertiesService.findOne(propertyId);
        const booking = await this.bookingsService.createBooking(propertyId, guestId, new Date(checkInDate), new Date(checkOutDate), totalPrice || 0);
        return booking;
    }
    async findMyTrips(guestId) {
        return this.reservationModel.find({ guestId }).populate('propertyId').exec();
    }
};
exports.ReservationsService = ReservationsService;
exports.ReservationsService = ReservationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(reservation_schema_1.Reservation.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        properties_service_1.PropertiesService,
        bookings_service_1.BookingsService])
], ReservationsService);
//# sourceMappingURL=reservations.service.js.map