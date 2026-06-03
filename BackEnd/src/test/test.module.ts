import { Module } from '@nestjs/common';
import { RedisTestController } from './redis-test.controller';
import { PropertiesModule } from '../properties/properties.module';

@Module({
  imports: [PropertiesModule],
  controllers: [RedisTestController],
})
export class TestModule {}
