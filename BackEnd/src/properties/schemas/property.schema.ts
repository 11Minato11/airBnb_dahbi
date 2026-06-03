import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type PropertyDocument = Property & Document;

@Schema({ timestamps: true, strict: false })
export class Property {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  hostId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, min: 0 })
  pricePerNight: number;

  @Prop({ required: true, min: 1 })
  maxGuests: number;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  })
  location: {
    type: string;
    coordinates: number[];
  };

  @Prop({
    type: {
      city: { type: String, required: true },
      country: { type: String, required: true },
    },
    required: true,
  })
  address: {
    city: string;
    country: string;
  };

  @Prop({ type: [String], default: [] })
  amenities: string[];

  @Prop({ required: false })
  imageUrl?: string;

  @Prop({ required: true, default: true })
  isActive: boolean;
}

export const PropertySchema = SchemaFactory.createForClass(Property);
PropertySchema.index({ location: '2dsphere' }); // Index Geospatial
