import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-yet';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PropertiesModule } from './properties/properties.module';
import { ReservationsModule } from './reservations/reservations.module';
import { ReviewsModule } from './reviews/reviews.module';
import { MessagesModule } from './messages/messages.module';
import { RedisModule } from './redis/redis.module';
import { BookingsModule } from './bookings/bookings.module';
import { ChatModule } from './chat/chat.module';
import { TestModule } from './test/test.module';
import { UserLikesModule } from './user-likes/user-likes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/airbemi_db', {
      lazyConnection: true,
      retryAttempts: 1,
      retryDelay: 1000,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 5000,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => ({
        ttl: 300, // Default TTL in seconds
        ...(process.env.REDIS_URL?.trim()
          ? {
              store: redisStore,
              url: process.env.REDIS_URL.trim(),
            }
          : {}),
      }),
    }),
    RedisModule,
    AuthModule,
    UsersModule,
    PropertiesModule,
    ReservationsModule,
    BookingsModule,
    ReviewsModule,
    MessagesModule,
    ChatModule,
    UserLikesModule,
    TestModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
