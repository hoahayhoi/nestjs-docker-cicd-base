import { Module } from '@nestjs/common';

import { CustomerServiceOrderDetailsController } from './customer-service-order-details.controller';
import { ServiceOrderDetailsService } from './service-order-details.service';
import { TechnicianServiceOrderDetailsController } from './technician-service-order-details.controller';

import { AppointmentsModule } from '@/appointments/appointments.module';
import { ServiceOrdersModule } from '@/service-orders/service-orders.module';

@Module({
  imports: [AppointmentsModule, ServiceOrdersModule],
  controllers: [TechnicianServiceOrderDetailsController, CustomerServiceOrderDetailsController],
  providers: [ServiceOrderDetailsService],
})
export class ServiceOrderDetailsModule {}
