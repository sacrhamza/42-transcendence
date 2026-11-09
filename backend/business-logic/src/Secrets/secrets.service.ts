import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SecretsService {
  constructor(
    private readonly config: ConfigService,
  ) {}

  getSecret(name: string): string {
    return this.config.getOrThrow<string>(name);
  }
}