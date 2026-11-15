import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AuthRequest } from '../common/types/auth-request.type.js';
import { SecretsService } from '../Secrets/secrets.service.js';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly jwtservice: JwtService,
    private readonly secretservice: SecretsService,
  ) {}
  async canActivate(context: ExecutionContext) {
    const req: AuthRequest = context.switchToHttp().getRequest<AuthRequest>();
    const token = req.cookies?.access_token;
    if (!token) throw new UnauthorizedException('Missing access token');
    let pylode: {
      sub: string;
    };
    try {
      pylode = await this.jwtservice.verifyAsync(token, {
        secret: this.secretservice.getSecret('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
    req.user = pylode.sub;
    return true;
  }
}
