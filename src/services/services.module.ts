import { Module } from '@nestjs/common';

import { AdminServicesController } from './admin-services.controller';
import { CustomerServicesController } from './customer-services.controller';
import { ServicesService } from './services.service';

@Module({
  controllers: [CustomerServicesController, AdminServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
