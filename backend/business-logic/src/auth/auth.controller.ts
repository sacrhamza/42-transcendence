import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  HttpStatus,
  Redirect,
} from '@nestjs/common';
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
  async login(@Body() data: LoginDto) {
    return this.authService.login(data);
  }
}
