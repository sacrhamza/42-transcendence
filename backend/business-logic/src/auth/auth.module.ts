import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { UserModule } from '../users/user.module.js';
import { EmailVerificationModule } from '../email-verification/email-verification.module.js';
import { RedisModule } from '../redis/redis.module.js';
import { JwtModule } from '@nestjs/jwt';
import { SecretsModule } from '../Secrets/secrets.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { SessionService } from './SessionService/session.service.js';
import { AuthGuard } from '../guards/authentication.guard.js';
@Module({
  imports: [
    UserModule,
    EmailVerificationModule,
    RedisModule,
    JwtModule.register({}),
    SecretsModule,
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [AuthGuard, AuthService, SessionService],
})
export class AuthModule {}
