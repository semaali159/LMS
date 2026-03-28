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
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtVerifyGuard } from './guards/jwt-verify.guard';
interface JwtPayload {
  userId: string;
  email: string;
  refreshToken?: string;
}

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto})
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    schema: {
      example: {
        userId: '12345',
        email: 'user@example.com',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
    schema: {
      example: {
        message: ['Email must be a valid email', 'Password is too short'],
      },
    },
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login a user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in',
    schema: {
      example: {
        accessToken: 'jwt-access-token',
        refreshToken: 'jwt-refresh-token',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    schema: {
      example: { message: 'Invalid email or password' },
    },
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify user email' })
  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 200,
    description: 'Email successfully verified ',
    schema: { example: { message: 'Email verified successfully. Please log in ' } },
  })
  @UseGuards(AuthGuard('verify-jwt'))
  verify(
  @GetUser('email') email: string,@Body() otp: string) {
    return this.authService.verifyOtp(email,otp);
  }


  @Post('resend-otp')
  @ApiOperation({ summary: 'Resend OTP  code' })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully ',
    schema: { example: { message: 'A new verification code has been sent.' } },
  })
async resendOtp(@Body() email: string) {
  return await this.authService.resendOtp(email);
}




  @Post('logout')
  @ApiOperation({ summary: 'Logout the current user' })
  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 200,
    description: 'User successfully logged out',
    schema: { example: { message: 'Logout successful' } },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: { example: { message: 'Unauthorized' } },
  })
  @UseGuards(AuthGuard('jwt'))
  logout(@GetUser() user: JwtPayload) {
    return this.authService.logout(user.userId);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  @ApiBearerAuth('access-token')
  @ApiResponse({
    status: 200,
    description: 'Tokens successfully refreshed',
    schema: {
      example: {
        accessToken: 'new-jwt-access-token',
        refreshToken: 'new-jwt-refresh-token',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid refresh token',
    schema: { example: { message: 'Invalid refresh token' } },
  })
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt-refresh'))
  refresh(@GetUser() user: JwtPayload) {
    //   const user = req.user as JwtPayload;
    return this.authService.refreshTokens(user.userId, user.refreshToken!);
  }
}
