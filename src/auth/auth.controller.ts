/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Request } from 'express';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import {
  ApiBearerAuth,
  // ApiBadRequestResponse,
  // ApiBody,
  // ApiCreatedResponse,
  // ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/common/decorators/get-user.decorator';
interface JwtPayload {
  userId: string;
  email: string;
  refreshToken?: string;
}

@Controller('auth')
@ApiTags('Authentication')
// @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('logout')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  logout(@GetUser() user: JwtPayload) {
    // const user = req.user as JwtPayload;
    // console.log(req.user);
    // console.log(user);
    return this.authService.logout(user.userId);
  }

  @Post('refresh')
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt-refresh'))
  refresh(@GetUser() user: JwtPayload) {
    //   const user = req.user as JwtPayload;
    return this.authService.refreshTokens(user.userId, user.refreshToken!);
  }
}
