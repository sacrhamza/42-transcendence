import { Module } from '@nestjs/common';
import { EmailVerificationService } from './email-verification.service.js';
import { RedisModule } from '../redis/redis.module.js';
import { MailModule } from '../mail/mail.module.js';
import { UserModule } from '../users/user.module.js';

@Module({
  imports: [RedisModule, MailModule, UserModule],
  providers: [EmailVerificationService],
  exports: [EmailVerificationService],
})
export class EmailVerificationModule {}