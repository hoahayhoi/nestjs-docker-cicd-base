import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

import { AuthService } from '../../auth.service';

@Injectable()
export class AdminLocalStrategy extends PassportStrategy(Strategy, 'admin-local') {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email', // hoặc 'username' tùy bạn
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    const admin = await this.authService.validateAdmin(email, password);

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!admin.isActive) {
      throw new BadRequestException('Account not activated');
    }

    return admin;
  }
}
