import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  public readonly client;

  constructor(private readonly configService: ConfigService) {
    this.client = createClient({
      url: this.configService.getOrThrow<string>('REDIS_URL'),
      disableOfflineQueue: true,
      socket: {
        connectTimeout: 1000,
        reconnectStrategy: (retries) => {
          return Math.min(retries * 100, 1000);
        },
      },
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis error', err);
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.client.connect();

      this.logger.log('Redis connected successfully');
    } catch (err) {
      this.logger.error('Cannot connect to Redis', err);
      throw err;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.close();
    }
  }

  // cmdline of redis ...

  async set(key: string, value: string, ttl: number): Promise<void> {
    await this.client.set(key, value, {
      EX: ttl,
    });
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async getDel(key: string): Promise<string | null> {
    return await this.client.getDel(key);
  }
}
