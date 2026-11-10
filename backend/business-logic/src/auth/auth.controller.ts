import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  HttpStatus,
  Redirect,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service.js';
import { RegisterDto } from '../dto/RegisterDto.js';
import { LoginDto } from '../dto/LogingDto.js';

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
    @Res({ passthrough: true }) res: Response,  // @Res() is a parameter decorater that give u object of http resqense object 
    // for this req so u can add somthing in the headers ...
  ) {
    const { accessToken, refreshToken } = await this.authService.login(data);

    // Refresh Token: 15 min
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: false,
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
      path: '/api/auth/refresh',
    });
    return {
      message: 'Login successful',
    };
  }

  // @Post('refresh')
  // async refresh(@Body('refreshtoken') refreshtoken: string) {
  //   // return this.authService.
  // }
}
