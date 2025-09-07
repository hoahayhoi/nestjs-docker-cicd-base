import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { User } from '@prisma/client';
import { Strategy } from 'passport-local';

import { AuthService } from '../../auth.service';

import { DeviceInfoDto } from '@/auth/dto/login-request.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'phone',
      passwordField: 'password',
      passReqToCallback: true,
    });
  }

  async validate(
    request: { body: { deviceInfo: DeviceInfoDto } },
    phone: string,
    password: string,
  ): Promise<User & { deviceInfo: DeviceInfoDto }> {
    const { deviceInfo } = request.body;

    if (!deviceInfo || deviceInfo == undefined) {
      throw new BadRequestException('Device information is required');
    }

    const user = await this.authService.validateUserByPhone(phone, password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new BadRequestException('Account not activated');
    }

    return {
      ...user,
      deviceInfo,
    };
  }
}
