import { Controller, Post, Body, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createReviewDto: CreateReviewDto, @Request() req: any) {
    const reviewerId = req.user.userId;
    return this.reviewsService.create(createReviewDto, reviewerId);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(@Request() req: any) {
    return this.reviewsService.findByReviewer(req.user.userId);
  }

  @Get('property/:propertyId')
  findByProperty(@Param('propertyId') propertyId: string) {
    return this.reviewsService.findByProperty(propertyId);
  }
}
