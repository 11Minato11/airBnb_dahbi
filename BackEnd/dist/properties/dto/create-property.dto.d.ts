declare class LocationDto {
    coordinates: number[];
}
declare class AddressDto {
    city: string;
    country: string;
}
export declare class CreatePropertyDto {
    title: string;
    description: string;
    pricePerNight: number;
    maxGuests: number;
    location?: LocationDto;
    address: AddressDto;
    amenities?: string[];
    imageUrl?: string;
    isActive?: boolean;
}
export {};
