import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';

import { WsException } from '@nestjs/websockets';
import type { Socket } from 'socket.io';

@Injectable()
export class WsAuthenticationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<Socket>();

    const user = client.data.user;

    if (!user || !Number.isSafeInteger(user.exp)) {
      throw new WsException('Unauthorized');
    }

    if (Date.now() >= user.exp * 1000) {
      throw new WsException('Access token expired');
    }

    return true;
  }
}