import { Module } from '@nestjs/common';

import { AdminAppointmentsController } from './admin-appointments.controller';
import { AppointmentsService } from './appointments.service';
import { CustomerAppointmentsController } from './customer-appointments.controller';
import { RepairImagesService } from './repair-image.service';
import { TechnicianAppointmentsController } from './technician-appointments.controller';

import { FcmModule } from '@/notifications/fcm/fcm.module';
import { SocketModule } from '@/notifications/socket/socket.module';
import { ServiceOrdersModule } from '@/service-orders/service-orders.module';
import { UsersModule } from '@/users/users.module';

@Module({
  imports: [SocketModule, FcmModule, UsersModule, ServiceOrdersModule],
  controllers: [CustomerAppointmentsController, AdminAppointmentsController, TechnicianAppointmentsController],
  providers: [AppointmentsService, RepairImagesService],
  exports: [AppointmentsService, RepairImagesService],
})
export class AppointmentsModule {}
