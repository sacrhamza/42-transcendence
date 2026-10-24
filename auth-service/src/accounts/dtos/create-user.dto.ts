import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  firstname!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  lastname!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  phone!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
    },
  )
  password!: string;
}
