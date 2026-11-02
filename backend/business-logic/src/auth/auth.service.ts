import {
  BadRequestException,
  Injectable,
  ConflictException,
} from '@nestjs/common';
import { RegisterDto } from './dto/RegisterDto.js';
import validations from './custom-func/lib.js';
import { UsersService } from '../users/user.service.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly userservice: UsersService) {}

  async registerNewUser(data: RegisterDto) {
    // additional check for if the password username
    if (validations.validators.register.password(data))
      throw new BadRequestException(
        `${validations.validators.register.message}`,
      );

    // const checkuser = await this.userservice.findByEmail(data.email);
    // if (checkuser)
    //   throw new ConflictException('Email or username already exists');

    // const hashed_pass = await bcrypt.hash(data.password, 12);
    // data.password = hashed_pass;

    // return this.userservice.createUser(data);
    return {
      mesg: 'validation pip is good',
    };
  }
}
