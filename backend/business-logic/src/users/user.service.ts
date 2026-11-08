import {
  Injectable,
  ConflictException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from '../dto/RegisterDto.js';
import { Prisma } from '../generated/prisma/client.js';

import { CreateUserDataDto } from '../dto/CreateUserDataDto.js';
import { RedisService } from '../redis/redis.service.js';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { MailService } from '../mail/mail.service.js';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly mailservice: MailService,
  ) {}

  // find
  async findByUsername(username: string) {
    try {
      return await this.prisma.users.findUnique({
        where: { name: username },
      });
    } catch (err) {
      this.logger.error('PostgreSQL username lookup failed', err);

      if (
        err instanceof PrismaClientKnownRequestError &&
        err.code === 'P1001'
      ) {
        throw new ServiceUnavailableException(
          'Database temporarily unavailable',
        );
      }
      throw err;
    }
  }

  async findByEmail(email: string) {
    try {
      return await this.prisma.normal_users.findUnique({
        where: {
          mail: email,
        },
        select: {
          mail: true,
        },
      });
    } catch (err) {
      this.logger.error('PostgreSQL username lookup failed', err);

      if (
        err instanceof PrismaClientKnownRequestError &&
        err.code === 'P1001'
      ) {
        throw new ServiceUnavailableException(
          'Database temporarily unavailable',
        );
      }
      throw err;
    }
  }

  async findByEmailForAuth(email: string) {
    try {
      return await this.prisma.normal_users.findUnique({
        where: {
          mail: email,
        },
        select: {
          password: true,
          users: {
            select: {
              id: true,
              name: true,
            }
          }
        },
      });
    } catch (err) {
      this.logger.error('PostgreSQL username lookup failed', err);

      if (
        err instanceof PrismaClientKnownRequestError &&
        err.code === 'P1001'
      ) {
        throw new ServiceUnavailableException(
          'Database temporarily unavailable',
        );
      }
      throw err;
    }
  }

  async createUser(data: CreateUserDataDto) {
    try {
      const res = await this.prisma.users.create({
        data: {
          name: data.username,
          bio: '',
          normal_users: {
            create: {
              mail: data.email,
              password: data.passwordHash,
            },
          },
        },
        select: {
          id: true,
        },
      });

      // set list for caching ...
      try {
        if (this.redisService.client.isReady) {
          await this.redisService.client.sAdd('names', data.username);
          await this.redisService.client.sAdd('mails', data.email);
        }
      } catch (error) {
        this.logger.warn('Redis cache update failed after user creation');
      }

      return {
        message: 'User registered successfully',
        userId: res.id.toString(),
        email: data.email,
        username: data.username,
      };
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Username or email already registered');
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P1001' || error.code === 'P1002')
      ) {
        // send msg 3lam fih user ...
        await this.mailservice.send_try_registreation(
          data.email,
          data.username,
        );
        throw new ServiceUnavailableException(
          'Database temporarily unavailable',
        );
      }
      throw error;
    }
  }
}
