import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { RedisService } from '../redis/redis.service.js';
import { MailService } from '../mail/mail.service.js';
import { RegisterDto } from '../dto/RegisterDto.js';

import { randomBytes, createHash } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { CreateUserDataDto } from '../dto/CreateUserDataDto.js';
import { UsersService } from '../users/user.service.js';

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);
  constructor(
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
    private readonly userservice: UsersService,
  ) {}

  async createPendingRegistration(data: RegisterDto): Promise<void> {
    // Generate random verification token
    const token = randomBytes(32).toString('hex');

    // Hash verification token
    const tokenHash = createHash('sha256').update(token).digest('hex');

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Prepare temporary registration data
    const pendingUser = {
      username: data.username,
      email: data.email,
      passwordHash,
    };
    try {
      // Store in Redis for 15 minutes
      await this.redisService.set(
        `registration:${tokenHash}`,
        JSON.stringify(pendingUser),
        900,
      );
    } catch (err) {
      this.logger.error('Failed to store pending registration', err);
      throw new ServiceUnavailableException(
        'Registration service temporarily unavailable',
      );
    }

    // Send verification email
    await this.mailService.sendEmailVerefecation(
      data.email,
      data.username,
      token,
    );
  }

  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const pendingData = await this.redisService.getDel(
      `registration:${tokenHash}`,
    );
    if (!pendingData)
      throw new BadRequestException('Verification token is invalid or expired');

    const user: CreateUserDataDto = JSON.parse(pendingData);
    const result = await this.userservice.createUser(user);

    // welcome email ...
    await this.mailService.sendWelcomeEmail(result.email, result.username);

    return {
      msg: result.message,
      userId: result.userId,
    };
  }

  async createPendingForgotPassword(email: string, username: string): Promise<void> {
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');

    // save this token in redis for 15 min ...
    try {
      await this.redisService.set(
        `forgot-password:${tokenHash}`,
        email,
        900,
      );
    } catch (err) {
      this.logger.error('Failed to store forgot password token', err);
      throw new ServiceUnavailableException(
        'Password reset service temporarily unavailable',
      );
    }

    // send email for reset password ...
    await this.mailService.sendForgotPasswordEmail(email, username, token);
  }

  async verifyForgotPasswordToken(token: string): Promise<string> {
    if (!token) {
      throw new BadRequestException('Reset token is required');
    }
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const email = await this.redisService.getDel(`forgot-password:${tokenHash}`);
    if (!email) {
      throw new BadRequestException('Reset token is invalid or expired');
    }
    return email;
  }
}
