import { Module } from '@nestjs/common';

import { CustomerNotificationsController } from './customer-notifications.controller';
import { FcmModule } from './fcm/fcm.module';
import { NotificationsService } from './notifications.service';

import { DevicesModule } from '@/devices/devices.module';

@Module({
  imports: [DevicesModule, FcmModule],
  controllers: [CustomerNotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
