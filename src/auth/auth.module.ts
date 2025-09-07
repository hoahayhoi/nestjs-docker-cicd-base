import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccessGuard } from './passport/guard/access.guard';
import { AdminLocalStrategy } from './passport/strategies/admin-local.strategy';
import { JwtStrategy } from './passport/strategies/jwt.strategy';
import { LocalStrategy } from './passport/strategies/local.strategy';

import { TechniciansModule } from '@/technicians/technicians.module';
import { UsersModule } from '@/users/users.module';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      global: true, // Set the JwtModule as global
      useFactory: (configService: ConfigService) =>
        Promise.resolve({
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: {
            expiresIn: configService.get<string>('JWT_ACCESS_TOKEN_EXPIRED'),
          },
        }),
      inject: [ConfigService],
    }),
    PassportModule,
    TechniciansModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    AdminLocalStrategy,
    {
      provide: 'APP_GUARD',
      useClass: AccessGuard,
    },
  ],
})
export class AuthModule {}
