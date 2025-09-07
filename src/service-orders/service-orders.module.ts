import { Module } from '@nestjs/common';

import { AdminServiceOrdersController } from './admin-service-orders.controller';
import { CustomerServiceOrdersController } from './customer-service-orders.controller';
import { ServiceOrdersService } from './service-orders.service';
import { TechnicianServiceOrdersController } from './technician-service-orders.controller';

import { NotificationsModule } from '@/notifications/notifications.module';
import { UsersModule } from '@/users/users.module';

@Module({
  imports: [NotificationsModule, UsersModule],
  controllers: [CustomerServiceOrdersController, AdminServiceOrdersController, TechnicianServiceOrdersController],
  providers: [ServiceOrdersService],
  exports: [ServiceOrdersService],
})
export class ServiceOrdersModule {}
