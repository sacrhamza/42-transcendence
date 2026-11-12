import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  HttpStatus,
  Res,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service.js';
import { RegisterDto } from '../dto/RegisterDto.js';
import { LoginDto } from '../dto/LogingDto.js';
import type { Request } from 'express';
import { AuthGuard } from '../guards/auth.guard.js';
import type { AuthRequest } from '../common/types/auth-request.type.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.ACCEPTED)
  async register(@Body() data: RegisterDto) {
    return this.authService.registerNewUser(data);
  }

  @Get('verify-email')
  @HttpCode(HttpStatus.CREATED)
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() data: LoginDto,
    @Res({ passthrough: true }) res: Response, // @Res() is a parameter decorater that give u object of http resqense object
    // for this req so u can add somthing in the headers ...
  ) {
    const { accessToken, refreshToken } = await this.authService.login(data);

    // Access Token: 5 min
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 5 * 60 * 1000,
      path: '/',
    });

    // Refresh Token: 7 days
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });
    return {
      message: 'Login successful',
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const all_cookis = req.cookies;
    const target: string | undefined = all_cookis?.['refresh_token'];

    if (target === undefined || typeof target !== 'string')
      throw new UnauthorizedException('Missing refresh token');

    const { accessToken, refreshToken, refreshExpiresAt } =
      await this.authService.refresh(target);

    const remaining_time = refreshExpiresAt.getTime() - new Date().getTime();
    if (remaining_time <= 0) throw new UnauthorizedException('Session expired');

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 5 * 60 * 1000,
      path: '/',
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: remaining_time,
      path: '/api/auth',
    });
    return {
      message: 'Tokens is refreshed successful',
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const all_cookis = req.cookies;
    const target: string | undefined = all_cookis?.['refresh_token'];

    if (typeof target === 'string' && target) {
      await this.authService.logout(target);
    }

    // deletion session !
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/api/auth' });
    return {
      message: 'Logout successful',
    };
  }

  // just test for authorisation ...
  @Get('user')
  @UseGuards(AuthGuard)
  someprotectedroute1() {
    return {
      msg: 'hello from protected route guards it work perfectly',
    };
  }
  // just for testing if req hold the userid !
  @Get('users')
  @UseGuards(AuthGuard)
  someprotectedroute2(@Req() req: AuthRequest) {
    return {
      userId: req.user,
      msg: 'Protected route works',
    };
  }
 
}
