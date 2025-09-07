import { Module } from '@nestjs/common';

import { CustomerSparePartsController } from './customer-spare-parts.controller';
import { SparePartsService } from './spare-parts.service';

@Module({
  controllers: [CustomerSparePartsController],
  providers: [SparePartsService],
  exports: [SparePartsService],
})
export class SparePartsModule {}
