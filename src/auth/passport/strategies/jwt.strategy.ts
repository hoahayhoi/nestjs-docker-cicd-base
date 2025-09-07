import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { DecodedToken } from '@/auth/interfaces/common.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  validate(payload: DecodedToken) {
    if (!payload.sub2) {
      return {
        _id: payload.sub,
        username: payload.username,
      };
    } else {
      return {
        _id: payload.sub,
        technicianId: payload.sub2,
        username: payload.username,
      };
    }
  }
}
