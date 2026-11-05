import {
  BadRequestException,
  Injectable,
  ConflictException,
} from '@nestjs/common';
import { RegisterDto } from './dto/RegisterDto.js';
import validations from './custom-func/lib.js';
import { UsersService } from '../users/user.service.js';

@Injectable()
export class AuthService {
  constructor(private readonly userservice: UsersService) {}

  async registerNewUser(data: RegisterDto) {
    // additional check for if the password username
    if (validations.validators.register.password(data))
      throw new BadRequestException(
        `${validations.validators.register.message}`,
      );

    // check if this email already taken !

    const existingEmail = await this.userservice.findByEmail(data.email);
    if (existingEmail) throw new ConflictException('Email already registered');

    // check if this username already taken !
    const existingUsername = await this.userservice.findByUsername(
      data.username,
    );
    if (existingUsername) throw new ConflictException('Username already taken');

    return this.userservice.createUser(data);
  }
}
