import {
  Injectable,
  ConflictException,
  Logger,
  ServiceUnavailableException,
  InternalServerErrorException,
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
      return await this.prisma.normal_users.findUnique({
        where: { name: username },
      });
    } catch (err: unknown) {
      this.logger.error('PostgreSQL username lookup failed', err);
      if (
        err instanceof PrismaClientKnownRequestError &&
        err.code === 'P1001'
      ) {
        throw new ServiceUnavailableException(
          'Database temporarily unavailable',
        );
      }
      throw new InternalServerErrorException('An unexpected error occurred');
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
    } catch (err: unknown) {
      this.logger.error('PostgreSQL username lookup failed', err);

      if (
        err instanceof PrismaClientKnownRequestError &&
        err.code === 'P1001'
      ) {
        throw new ServiceUnavailableException(
          'Database temporarily unavailable',
        );
      }
      throw new InternalServerErrorException('An unexpected error occurred');
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
              deleted: true,
            },
          },
        },
      });
    } catch (err: unknown) {
      this.logger.error('PostgreSQL username lookup failed', err);

      if (
        err instanceof PrismaClientKnownRequestError &&
        err.code === 'P1001'
      ) {
        throw new ServiceUnavailableException(
          'Database temporarily unavailable',
        );
      }
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async createUser(data: CreateUserDataDto) {
    try {
      const res = await this.prisma.users.create({
        data: {
          bio: '',
          normal_users: {
            create: {
              mail: data.email,
              password: data.passwordHash,
              name: data.username,
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
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  // for 42 accounts ...

  async findUserByFortyTowId(intra_id: bigint) {
    try {
      return await this.prisma.ft_users.findUnique({
        where: {
          intra_id: intra_id,
        },
        select: {
          intra_id: true,
          name: true,
          users: {
            select: {
              id: true,
              deleted: true,
            },
          },
        },
      });
    } catch (err: unknown) {
      this.logger.error('PostgreSQL username lookup failed', err);
      // ila tra chy mochkil ...
      if (
        err instanceof PrismaClientKnownRequestError &&
        err.code === 'P1001'
      ) {
        throw new ServiceUnavailableException(
          'Database temporarily unavailable',
        );
      }
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async createUserFortyTow(data: {
    intraId: bigint;
    username: string;
    profileImage: string | null;
    email: string | null;
  }) {
    try {
      return await this.prisma.users.create({
        data: {
          bio: '',
          profile_image: data.profileImage ?? undefined,

          ft_users: {
            create: {
              intra_id: data.intraId,
              name: data.username,
            },
          },
        },
        select: {
          id: true,
          deleted: true,
          ft_users: {
            select: {
              name: true,
              intra_id: true,
            },
          },
        },
      });
    } catch (err: unknown) {
      this.logger.error('Failed to create 42 user', err);
      if (data.email) {
        await this.mailservice.sendFortyTwoRegistrationFailure(
          data.email,
          data.username,
        );
      }

      if (
        err instanceof PrismaClientKnownRequestError &&
        err.code === 'P1001'
      ) {
        throw new ServiceUnavailableException(
          'Database temporarily unavailable',
        );
      }
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }
}
