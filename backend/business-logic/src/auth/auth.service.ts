import {
  BadRequestException,
  Injectable,
  ConflictException,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { RegisterDto } from '../dto/RegisterDto.js';
import validations from './custom-func/lib.js';
import { UsersService } from '../users/user.service.js';
import { EmailVerificationService } from '../email-verification/email-verification.service.js';
import { RedisService } from '../redis/redis.service.js';
import { LoginDto } from '../dto/LogingDto.js';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SecretsService } from '../Secrets/secrets.service.js';
import { hash, randomUUID } from 'node:crypto';
import { SessionService } from './SessionService/session.service.js';
import { setServers } from 'node:dns';
import { name } from 'nodemailer/lib/package-info.js';
import { PrismaClientRustPanicError } from '@prisma/client/runtime/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly userservice: UsersService,
    private readonly emailverification: EmailVerificationService,
    private readonly redisService: RedisService,
    private readonly jwtservice: JwtService,
    private readonly secretsserver: SecretsService,
    private readonly sesstionservice: SessionService,
  ) {}

  async registerNewUser(data: RegisterDto) {
    // additional check for if the password username
    if (validations.validators.register.password(data))
      throw new BadRequestException(
        `${validations.validators.register.message}`,
      );

    let nameExist: number = 0;
    let mailExist: number = 0;
    // check if database aviliable ...
    if (this.redisService.client.isReady) {
      try {
        nameExist = await this.redisService.client.sIsMember(
          'names',
          data.username,
        );
      } catch {}
      try {
        mailExist = await this.redisService.client.sIsMember(
          'mails',
          data.email,
        );
      } catch {}
    }
    if (nameExist) throw new ConflictException('User already registered');
    if (mailExist) throw new ConflictException('Email already registered');

    // check database
    // check if this username already taken !
    const existingUsername = await this.userservice.findByUsername(
      data.username,
    );
    if (existingUsername) throw new ConflictException('Username already taken');
    const existingEmail = await this.userservice.findByEmail(data.email);
    if (existingEmail) throw new ConflictException('Email already registered');

    // creat pendingregistration ...
    await this.emailverification.createPendingRegistration(data);
    return {
      msg: 'check your email',
    };
  }

  async verifyEmail(token: string) {
    return this.emailverification.verifyEmail(token);
  }

  async login(data: LoginDto) {
    const user = await this.userservice.findByEmailForAuth(data.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const is_valid_pass = await bcrypt.compare(data.password, user.password);
    if (!is_valid_pass) throw new UnauthorizedException('Invalid credentials');

    const accessToken = await this.jwtservice.signAsync(
      {
        sub: user.users.id.toString(),
      },
      {
        secret: this.secretsserver.getSecret('JWT_ACCESS_SECRET'),
        expiresIn: '5m',
      },
    );

    const refreshToken = await this.jwtservice.signAsync(
      {
        sub: user.users.id.toString(),
        jti: randomUUID(),
      },
      {
        secret: this.secretsserver.getSecret('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      },
    );
    // generate my data that i need for my session managment !

    const pylode = await this.jwtservice.verifyAsync<{
      sub: string;
      jti: string;
      iat: number;
      exp: number;
    }>(refreshToken, {
      secret: this.secretsserver.getSecret('JWT_REFRESH_SECRET'),
    });

    const exp_at = new Date(pylode.exp * 1000);
    const hashed_token = await bcrypt.hash(refreshToken, 12);
    await this.sesstionservice.createSession({
      userId: user.users.id,
      jti: pylode.jti,
      tokenHash: hashed_token,
      expiresAt: exp_at,
    });
    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
    };
  }
  // in progriss just  testing ! ...
  async refresh(refreshToken: string) {
    let pylode: {
      sub: string;
      jti: string;
      exp: number;
    };
    try {
      pylode = await this.jwtservice.verifyAsync<{
        sub: string;
        jti: string;
        exp: number;
      }>(refreshToken, {
        secret: this.secretsserver.getSecret('JWT_REFRESH_SECRET'),
      });
      console.log('STEP 1: JWT VERIFIED SUCCESSFULLY');
    } catch (error) {
      console.error(
        'STEP 1: JWT VERIFICATION FAILED:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = await this.sesstionservice.findSessionByJti(pylode.jti);
    console.log('STEP 2: SESSION FOUND:', !!session);
    if (!session) throw new UnauthorizedException('Invalid refresh token');

    // Verify session ownership and expiration
    if (
      session.fk_user_id.toString() !== pylode.sub ||
      session.expires_at <= new Date()
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const verify = await bcrypt.compare(refreshToken, session.token_hash);
    if (!verify) throw new UnauthorizedException('Invalid refresh token');

    const newAccessToken = await this.jwtservice.signAsync(
      { sub: pylode.sub },
      {
        secret: this.secretsserver.getSecret('JWT_ACCESS_SECRET'),
        expiresIn: '5m',
      },
    );

    const new_jti: string = randomUUID();
    const newRefreshToken = await this.jwtservice.signAsync(
      {
        sub: pylode.sub,
        jti: new_jti,
        exp: pylode.exp,
      },
      {
        secret: this.secretsserver.getSecret('JWT_REFRESH_SECRET'),
      },
    );

    const hashed_new_refresh_token = await bcrypt.hash(newRefreshToken, 12);

    // converte old expiration to mils socend
    const exp: Date = new Date(pylode.exp * 1000);

    await this.sesstionservice.rotateSession(
      {
        jti: new_jti,
        tokenHash: hashed_new_refresh_token,
        expiresAt: exp,
      },
      session.id,
      session.jti,
    );
    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      refreshExpiresAt: exp,
    };
  }
  async logout(refresh_token: string) {
    let pylode: {
      sub: string;
      jti: string;
    };
    try {
      pylode = await this.jwtservice.verifyAsync<{ sub: string; jti: string }>(
        refresh_token,
        {
          secret: this.secretsserver.getSecret('JWT_REFRESH_SECRET'),
        },
      );
    } catch {
      return;
    }

    await this.sesstionservice.deleteSession(pylode.jti, BigInt(pylode.sub));
  }
}
