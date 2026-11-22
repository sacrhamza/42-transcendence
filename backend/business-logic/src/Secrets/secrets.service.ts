import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SecretsService {
  constructor(private readonly config: ConfigService) {}

  private static secrets: Record<string, string> = {};

  // mehode for store all secrets ...
  static setSecrets(data: Record<string, string>): void {
    SecretsService.secrets = { ...data };
  }

  // ...  in progreess !
  getSecret(name: string): string {
    return this.config.getOrThrow<string>(name);
  }

  getSecret2(name: string): string {
    const value = SecretsService.secrets[name];

    if (value === undefined) {
      throw new Error(`Missing secret: ${name}`);
    }

    return value;
  }
}
