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
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(250)
  email: string;

  @IsNotEmpty()
  @IsString()
  @Length(2, 150)
  username: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;
@IsString()
  role?: Role;
  // @IsString()
  // @IsOptional()
  // // tenantId: string; //In real application we got it from company domain
}
