import { Module } from '@nestjs/common';

import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

import { TechniciansModule } from '@/technicians/technicians.module';

@Module({
  imports: [TechniciansModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
