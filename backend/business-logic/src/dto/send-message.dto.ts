import {
  IsInt,
  IsPositive,
  IsString,
  IsNotEmpty,
  MaxLength,
  Matches,
} from 'class-validator';

export class SendMessageDto {
  @IsInt()
  @IsPositive()
  receiverId!: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, {
    message: 'Message cannot contain only whitespace',
  })
  @MaxLength(2000)
  message!: string;
}