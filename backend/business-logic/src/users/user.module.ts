import { Module } from '@nestjs/common';
import { UsersService } from './user.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { RedisModule } from '../redis/redis.module.js';
import { EmailVerificationService } from '../email-verification/email-verification.service.js';
import { MailModule } from '../mail/mail.module.js';

@Module({
  imports: [PrismaModule, RedisModule, MailModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UserModule {}
