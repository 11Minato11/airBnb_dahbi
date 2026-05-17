import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Property, PropertyDocument } from './schemas/property.schema';
import { CreatePropertyDto } from './dto/create-property.dto';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectModel(Property.name) private propertyModel: Model<PropertyDocument>,
  ) {}

  async create(createPropertyDto: CreatePropertyDto, hostId: string): Promise<PropertyDocument> {
    const newProperty = new this.propertyModel({
      ...createPropertyDto,
      hostId,
    });
    return newProperty.save();
  }

  async findAll(query: any): Promise<PropertyDocument[]> {
    const filter: any = { isActive: true };

    // Filtre par ville
    if (query.city) {
      filter['address.city'] = { $regex: new RegExp(query.city, 'i') };
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
    const property = await this.propertyModel.findById(id).exec();
    if (!property) throw new NotFoundException(`Property with ID ${id} not found`);
    return property;
  }

  async findByHost(hostId: string): Promise<PropertyDocument[]> {
    return this.propertyModel.find({ hostId }).exec();
  }

  async remove(id: string, hostId: string): Promise<{ deleted: boolean }> {
    const property = await this.findOne(id);
    if (property.hostId.toString() !== hostId) {
      throw new NotFoundException('Vous n\'êtes pas le propriétaire de ce logement.');
    }
    await this.propertyModel.findByIdAndDelete(id).exec();
    return { deleted: true };
  }
}
