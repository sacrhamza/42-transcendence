import {
  IsOptional,
  IsString,
  IsNotEmpty,
  MaxLength,
  IsStrongPassword,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  first_name?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  last_name?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
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
  password?: string;
}
