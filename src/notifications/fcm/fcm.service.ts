import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppointmentStatusEnum } from '@prisma/client';
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';

import { UserEvents } from '../socket/socket.event';

@Injectable()
export class FcmService implements OnModuleInit {
  private firebaseApp: admin.app.App;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const serviceAccount: ServiceAccount = {
      projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
      privateKey: this.configService.get<string>('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
      clientEmail: this.configService.get<string>('FIREBASE_CLIENT_EMAIL'),
    };

    this.firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  async sendNotification(
    deviceToken: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<string | null> {
    try {
      const message: admin.messaging.Message = {
        token: deviceToken,
        notification: {
          title,
          body,
        },
        data,
      };

      const response = await this.firebaseApp.messaging().send(message);

      return response;
    } catch (error) {
      console.error('Error sending FCM message:', error);

      return null;
    }
  }

  async notifyAppointmentStatusChanged(deviceToken: string, appointmentId: number, newStatus: AppointmentStatusEnum) {
    const title = 'Appointment status updated';
    const body = `Your appointment #${appointmentId} is now ${newStatus}`;
    const data = {
      appointmentId: appointmentId.toString(),
      newStatus,
      type: UserEvents.APPOINTMENT_STATUS_CHANGED,
    };

    return this.sendNotification(deviceToken, title, body, data);
  }

  getAuth() {
    return this.firebaseApp.auth();
  }

  getMessaging() {
    return this.firebaseApp.messaging();
  }

  getFirestore() {
    return this.firebaseApp.firestore();
  }
}
