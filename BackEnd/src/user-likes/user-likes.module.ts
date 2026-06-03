import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserLike, UserLikeSchema } from './schemas/user-like.schema';
import { UserLikesController } from './user-likes.controller';
import { UserLikesService } from './user-likes.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: UserLike.name, schema: UserLikeSchema }])],
  controllers: [UserLikesController],
  providers: [UserLikesService],
  exports: [UserLikesService],
})
export class UserLikesModule {}
