import {
  Injectable,
  ServiceUnavailableException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { log } from 'node:console';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  constructor(private readonly prisma: PrismaService) {}

  async createSession(sub: {
    userId: bigint;
    jti: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    try {
      return await this.prisma.refresh_sessions.create({
        data: {
          fk_user_id: sub.userId,
          token_hash: sub.tokenHash,
          expires_at: sub.expiresAt,
          jti: sub.jti,
        },
      });
    } catch (err) {
      this.logger.error('Failed to create session', err);
      throw new ServiceUnavailableException('Database temporarily unavailable');
    }
  }
  async findSessionsByUserId(id: bigint) {
    // check if the token exist for creat new token !
    try {
      return await this.prisma.refresh_sessions.findMany({
        where: {
          fk_user_id: id,
        },
      });
    } catch (err) {
      this.logger.error('Failed to create session', err);
      throw new ServiceUnavailableException('Database temporarily unavailable');
    }
  }

  async findSessionByJti(jti: string) {
    try {
      return await this.prisma.refresh_sessions.findUnique({
        where: {
          jti: jti,
        },
      });
    } catch (err) {
      this.logger.error('Failed to get jti', err);
      throw new ServiceUnavailableException('Database temporarily unavailable');
    }
  }
  async rotateSession(
    data: {
      jti: string;
      tokenHash: string;
      expiresAt: Date;
    },
    sessionid: bigint,
    old_jti: string,
  ) {
    let object;
    try {
      object = await this.prisma.refresh_sessions.updateMany({
        where: {
          id: sessionid,
          jti: old_jti,
        },
        data: {
          jti: data.jti,
          token_hash: data.tokenHash,
          expires_at: data.expiresAt,
        },
      });
    } catch (err) {
      this.logger.error('Failed to update session', err);
      throw new ServiceUnavailableException('Database temporarily unavailable');
    }
    if (object.count !== 1) {
      throw new UnauthorizedException('Session expired or already rotated');
    }
  }
  // updateSession()
  // deleteSession()
}
