import {
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';

import { Server, type Socket } from 'socket.io';
import { SendMessageDto } from '../dto/send-message.dto.js';
import {
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { parseCookie } from 'cookie';
import { JwtService } from '@nestjs/jwt';
import { SecretsService } from '../Secrets/secrets.service.js';
import { UseGuards } from '@nestjs/common';
import { WsAuthenticationGuard } from '../guards/ws-authentication.guard.js';

@WebSocketGateway()
@UseGuards(WsAuthenticationGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) => new WsException(errors),
  }),
)
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly jwtservice: JwtService,
    private readonly secretservice: SecretsService,
  ) {}
  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    server.use(async (client, next) => {
      // console.log('Cookies:', client.handshake.headers.cookie);
      const cookies = parseCookie(client.handshake.headers.cookie ?? '');

      const token = cookies.access_token;
      if (!token) return next(new Error('Missing access token'));

      try {
        const pylode: {
          sub: string;
          role: string;
          exp: number;
        } = await this.jwtservice.verifyAsync(token, {
          secret: this.secretservice.getSecret('JWT_ACCESS_SECRET'),
        });
        client.data.user = {
          user_id: Number(pylode.sub),
          role: pylode.role,
          exp: pylode.exp,
        };
      } catch {
        return next(
          new UnauthorizedException('Invalid or expired access token'),
        );
      }

      next();
    });
  }

  async handleConnection(client: Socket): Promise<void> {
    const expiresIn = client.data.user.exp * 1000 - Date.now();
    if (expiresIn <= 0) {
      client.disconnect(true);
      return;
    }

    const timer = setTimeout(() => {
      console.log('Token expired:', client.id);
      client.emit('auth_expired', {
        message: 'Access token expired',
      });
      client.disconnect(true);
    }, expiresIn);
    client.once('disconnect', () => {
      clearTimeout(timer);
      console.log('Timer cleared:', client.id);
    });

    await client.join(`user:${client.data.user.user_id}`);
    console.log('User ID:', client.data.user.user_id);
    console.log('Socket ID:', client.id);
    console.log('Rooms:', client.rooms);
  }

  handleDisconnect(client: Socket): void {
    console.log('DISCONNECTED:', client.id);
  }

  // event for send a message !
  @SubscribeMessage('sendMessage')
  handleMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(`user:${data.receiverId}`).emit('receiveMessage', {
      senderID: client.data.user_id,
      message: data.message,
    });

    return {
      success: true,
      message: 'Message processed successfully',
    };
  }

}
