import { Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserLikesService } from './user-likes.service';

@Controller('likes')
export class UserLikesController {
  constructor(private readonly userLikesService: UserLikesService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyLikes(@Request() req: any) {
    return this.userLikesService.getLikedPropertyIds(req.user.userId);
  }

  @Get('me/:propertyId')
  @UseGuards(JwtAuthGuard)
  isLiked(@Request() req: any, @Param('propertyId') propertyId: string) {
    return this.userLikesService.isLiked(req.user.userId, propertyId);
  }

  @Post(':propertyId/toggle')
  @UseGuards(JwtAuthGuard)
  toggleLike(@Request() req: any, @Param('propertyId') propertyId: string) {
    return this.userLikesService.toggleLike(req.user.userId, propertyId);
  }
}
