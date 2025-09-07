import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || '',
      scope: ['email', 'profile'],
    });
  }
  validate(accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) {
    const { name, emails, photos } = profile;

    const user = {
      email: emails === undefined ? '' : emails[0] == undefined ? '' : emails[0].value,
      firstName: name == undefined ? '' : name.givenName,
      lastName: name == undefined ? '' : name.familyName,
      picture: photos == undefined ? '' : photos[0].value,
      accessToken,
      refreshToken,
    };

    done(null, user);
  }
}
