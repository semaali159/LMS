import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginDto {
    @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(250)
  email: string;
    @ApiProperty({
    example: 'SDsfEF##%223',
    description: 'User password',
  })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;
}
