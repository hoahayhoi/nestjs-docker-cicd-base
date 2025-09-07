import { Injectable } from '@nestjs/common';
import { AppointmentStatusEnum } from '@prisma/client';

import { UserEvents } from './socket.event';
import { SocketGateway } from './socket.gateway';

@Injectable()
export class SocketService {
  constructor(private readonly socketGateway: SocketGateway) {}

  notifyOrderStatusChanged(userId: number, appointmentId: number, newStatus: AppointmentStatusEnum) {
    this.socketGateway.sendToUser(userId, UserEvents.APPOINTMENT_STATUS_CHANGED, {
      appointmentId,
      newStatus,
      timestamp: new Date().toISOString(),
    });
  }
}
