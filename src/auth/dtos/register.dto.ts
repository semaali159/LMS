import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from 'src/common/enums/roles.enum';

export class RegisterDto {
    @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(250)
  email: string;

    @ApiProperty({
    example: 'queen sema',
    description: 'User name',
  })
  @IsNotEmpty()
  @IsString()
  @Length(2, 150)
  username: string;

    @ApiProperty({
    example: 'SDsfEF##%223',
    description: 'User password',
  })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;
    @ApiProperty({
    example: ['student', 'instructor']
  })
@IsString()
  role?: Role;
  // @IsString()
  // @IsOptional()
  // // tenantId: string; //In real application we got it from company domain
}
