import {
  BadRequestException,
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from '../dto/RegisterDto.js';
import validations from './custom-func/lib.js';
import { UsersService } from '../users/user.service.js';
import { EmailVerificationService } from '../email-verification/email-verification.service.js';
import { RedisService } from '../redis/redis.service.js';
import { LoginDto } from '../dto/LogingDto.js';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
// import { name } from 'nodemailer/lib/package-info.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly userservice: UsersService,
    private readonly emailverification: EmailVerificationService,
    private readonly redisService: RedisService,
    private readonly jwtservice: JwtService,
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

    const accessToken = await this.jwtservice.signAsync({
      sub: user.users.id.toString(),
      name: user.users.name,
      email: data.email,
    });
    
    const rfreshToken = await this.jwtservice.signAsync({
      sub: user.users.id.toString()
    })

    // const payload = await this.jwtservice.verifyAsync(accessToken);

    // console.log(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
    };
  }
}
