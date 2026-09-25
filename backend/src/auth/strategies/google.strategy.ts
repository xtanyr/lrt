import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || 'unconfigured',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || 'unconfigured',
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || '/api/auth/google/callback',
      scope: ['email', 'profile'],
      passReqToCallback: false,
    } as any);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<void> {
    const { emails, name, id } = profile;
    const email = emails?.[0]?.value;
    if (!email) {
      return done(new Error('No email found in Google profile'), undefined);
    }
    try {
      const user = await this.authService.validateGoogleUser({
        email,
        name: name?.givenName || email,
        googleOauthId: id,
      });
      done(undefined, user);
    } catch (error) {
      done(error, undefined);
    }
  }
}
