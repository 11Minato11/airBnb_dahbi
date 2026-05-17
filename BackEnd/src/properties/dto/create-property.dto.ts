import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

class LocationDto {
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  coordinates: number[];
}

class AddressDto {
  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  country: string;
}

export class CreatePropertyDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  pricePerNight: number;

  @IsNumber()
  @IsNotEmpty()
  maxGuests: number;

  @IsObject()
  @IsOptional()
  location?: LocationDto;

  @IsObject()
  @IsNotEmpty()
  address: AddressDto;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  amenities?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
