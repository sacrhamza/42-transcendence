import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
  Matches,
  NotEquals,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @Transform(function (params) {
    const value = params.value;

    if (typeof value === 'string') {
      return value.toLowerCase();
    }

    return value;
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  @MinLength(2)
  @Matches(/^\S+$/, {
    message: 'user must not contain whitespace',
  })
  username: string;

  @Transform(function (params) {
    const value = params.value;

    if (typeof value === 'string') {
      return value.toLowerCase();
    }

    return value;
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  @Matches(/^\S+$/, {
    message: 'password must not contain whitespace',
  })
  password: string;
}
