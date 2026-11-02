import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/RegisterDto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authervice: AuthService) {}

  @Post('/register')
  async register(@Body() data: RegisterDto) {
    return this.authervice.registerNewUser(data);
  }
}
