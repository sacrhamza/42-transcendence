import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
// import { Strategy } from 'passport-42';
import { SecretsService } from '../../Secrets/secrets.service.js';
import { use } from 'passport';

import { createRequire } from 'node:module';

// Create a CommonJS require function
const require = createRequire(import.meta.url);

// Load passport-42 using CommonJS
const Strategy = require('passport-42').Strategy;
// we use the provider of passport-42 that we install via npm ...

@Injectable()
export class fortytowstrategy extends PassportStrategy(Strategy, '42') {
  constructor(private readonly secretservice: SecretsService) {
    super({
      clientID: secretservice.getSecret('INTRA_UID'),
      clientSecret: secretservice.getSecret('INTRA_SECRET'),
      callbackURL: secretservice.getSecret('INTRA_CALLBACK'),
      scope: ['public'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    const user = {
      accessToken,
      refreshToken,
      profile,
    };
    // console.log(user.profile);
    return {
      intraId: BigInt(profile.id),
      username: profile.username,
      email: profile.emails?.[0]?.value ?? null,
      profileImage: profile._json?.image?.link ?? null,
    };
  }
}
