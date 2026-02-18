import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get('FACEBOOK_APP_ID') || 'mock-app-id',
      clientSecret:
        configService.get('FACEBOOK_APP_SECRET') || 'mock-app-secret',
      callbackURL:
        configService.get('FACEBOOK_CALLBACK_URL') ||
        'http://localhost:4000/auth/facebook/callback',
      scope: ['email'],
      profileFields: ['emails', 'name', 'photos'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user: any, info?: any) => void,
  ): Promise<any> {
    const { name, emails, photos, id } = profile;
    const user = {
      email: emails && emails.length > 0 ? emails[0].value : null,
      firstName: name ? name.givenName : '',
      lastName: name ? name.familyName : '',
      picture: photos && photos.length > 0 ? photos[0].value : null,
      facebookId: id,
      accessToken,
    };
    done(null, user);
  }
}
