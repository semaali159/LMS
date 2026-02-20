/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../User/user.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/common/enums/roles.enum';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.create(
      dto.email,
      dto.password,
      dto.username,
      dto.role
    );

    return {
      message: 'User created successfully, please login',
      userID: user.id,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatches = await this.comparePassword(
      dto.password,
      user.password,
    );
    if (!passwordMatches)
      throw new UnauthorizedException('Invalid credentials');

    const roles = this.getUserRoles(user);
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      roles,
      // user.tenantId,
    );
    await this.usersService.updateRefreshToken(
      user.id,
      tokens.refreshToken,
    );
    return tokens;
  }

  async logout(userId: string) {
    await this.usersService.removeRefreshToken(userId);
    console.log(userId)
    return { message: 'Logged out successfully' };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.refreshToken)
      throw new UnauthorizedException('Invalid refresh token');

    const isValid = await this.comparePassword(refreshToken, user.refreshToken);
    if (!isValid) throw new UnauthorizedException('Invalid refresh token');

    const roles = this.getUserRoles(user);
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      roles,
      // user.tenantId,
    );
    await this.usersService.updateRefreshToken(
      user.id,
      tokens.refreshToken,
    );
    return tokens.accessToken;
  }

  private async generateTokens(
    userId: string,
    email: string,
    roles: Role[],
    // tenantId: string,
  ) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, roles },
        {
          secret:this.configService.get<string>('jwt.accessSecret'),
          expiresIn: this.configService.get<number>('jwt.accessExpiresIn')
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email, roles },
        {
          secret: this.configService.get<string>('jwt.refreshSecret'),
          expiresIn: this.configService.get<number>('jwt.refreshExpiresIn')
        },
      ),
    ]);
    return { accessToken, refreshToken };
  }
  private getUserRoles(user: any): Role[] {
    return user.role?.length ? user.role : [Role.STUDENT];
  }
  private async comparePassword(plain: string, hashed: string) {
    return bcrypt.compare(plain, hashed);
  }
}
