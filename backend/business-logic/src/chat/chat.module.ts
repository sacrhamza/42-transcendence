import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway.js';
import { JwtModule } from '@nestjs/jwt';
import { SecretsModule } from '../Secrets/secrets.module.js';
import { WsAuthenticationGuard } from '../guards/ws-authentication.guard.js';

@Module({
  imports: [JwtModule, SecretsModule],
  providers: [ChatGateway, WsAuthenticationGuard],
})
export class ChatModule {}
