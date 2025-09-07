import { Module } from '@nestjs/common';

import { AdminDevicesController } from './admin-devices.controller';
import { CustomerDevicesController } from './customer-devices.controller';
import { DevicesService } from './devices.service';

@Module({
  controllers: [CustomerDevicesController, AdminDevicesController],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}
