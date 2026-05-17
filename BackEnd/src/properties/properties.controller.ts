import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, Delete } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createPropertyDto: CreatePropertyDto, @Request() req: any) {
    // req.user.userId correspond à payload.sub défini dans jwt.strategy.ts
    const hostId = req.user.userId;
    return this.propertiesService.create(createPropertyDto, hostId);
  }

  @Get('my-listings')
  @UseGuards(JwtAuthGuard)
  findMyListings(@Request() req: any) {
    return this.propertiesService.findByHost(req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.propertiesService.remove(id, req.user.userId);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.propertiesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }
}
