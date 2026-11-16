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
}
