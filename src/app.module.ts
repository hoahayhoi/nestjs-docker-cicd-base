import { createKeyv } from '@keyv/redis';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

import { AppointmentsModule } from './appointments/appointments.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/passport/guard/jwt-auth.guard';
import { GoogleStrategy } from './auth/passport/strategies/google.strategy';
import { DatabaseModule } from './database/database.module';
import { DevicesModule } from './devices/devices.module';
import { FileStorageModule } from './file-storage/file-storage.module';
import { FileUploadModule } from './file-upload/file-upload.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PermissionsModule } from './permissions/permissions.module';
import { ReviewsModule } from './reviews/reviews.module';
import { RolesModule } from './roles/roles.module';
import { ServiceOrderDetailsModule } from './service-order-details/service-order-details.module';
import { ServiceOrdersModule } from './service-orders/service-orders.module';
import { ServicesModule } from './services/services.module';
import { SparePartsModule } from './spare-parts/spare-parts.module';
import { TechniciansModule } from './technicians/technicians.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.registerAsync({
      useFactory: (configService: ConfigService) =>
        Promise.resolve({
          stores: [
            // Redis store
            createKeyv(configService.get<string>('REDIS_URL')),
          ],
        }),
      isGlobal: true,
      inject: [ConfigService],
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        Promise.resolve({
          transport: {
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            // ignoreTLS: true,
            // secure: false,
            auth: {
              user: configService.get<string>('MAIL_USER'),
              pass: configService.get<string>('MAIL_PASSWORD'),
            },
          },
          defaults: {
            from: '"No Reply" <no-reply@localhost>',
          },
          // preview: true,
          template: {
            dir: process.cwd() + '/src/common/mail/templates/',
            adapter: new HandlebarsAdapter(), // or new PugAdapter() or new EjsAdapter()
            options: {
              strict: true,
            },
          },
        }),
      inject: [ConfigService],
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    ServicesModule,
    ServiceOrdersModule,
    NotificationsModule,
    DevicesModule,
    // FirebaseModule,
    AppointmentsModule,
    ServiceOrderDetailsModule,
    TechniciansModule,
    SparePartsModule,
    RolesModule,
    PermissionsModule,
    FileStorageModule,
    FileUploadModule,
    ReviewsModule,
  ],
  providers: [
    GoogleStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
