/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, ConflictException, HttpException, Inject, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../User/user.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import * as bcrypt from 'bcrypt';
import { Role } from 'src/common/enums/roles.enum';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from 'src/redis/redis.constants';
import { MailService } from 'src/mail/mail.service';
import { DataSource } from 'typeorm';
import { VerifyOTPDto } from './dtos/otp.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
@Injectable()
export class AuthService {
  constructor(
@Inject(REDIS_CLIENT) private readonly redis: Redis,
@InjectQueue('mail') private readonly mailQueue: Queue,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private dataSource: DataSource,
  ) {}

  async register(dto: RegisterDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect()
    await queryRunner.startTransaction()
    try{
      const user =  await this.usersService.create(dto.email,dto.password,dto.username,dto.role, queryRunner.manager)
      
      await queryRunner.commitTransaction();

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const key = `otp:${dto.email}`;
      const limitKey = `otp-limit:${dto.email}`; 

      const hashedOtp = await bcrypt.hash(otp, 10);
      await this.redis.set(
        key,
        hashedOtp,
        'EX',
        300,
      );

      await this.redis.set(limitKey,1,'EX',3600)
      await this.mailQueue.add(
        'send-otp',
        {
          email: dto.email,
          otp
        },
        {
          attempts: 3,
          backoff:{
            type:'exponential',
            delay:3000
          },
          removeOnComplete: 100,
          removeOnFail:50
        }
      )
      
      const verifyToken = await this.generateVerifyToken(user.email);

    return {
      message: 'User created successfully. Please check your email.',
      verifyToken
    };
    }catch(error){
      await queryRunner.rollbackTransaction();
        if (error instanceof HttpException) throw error;
        console.error('Registration error:', error);
    throw new InternalServerErrorException('Registration failed');
  
     } finally {
    await queryRunner.release();
  }

     
  }

  async verifyOtp(email: string, dto: VerifyOTPDto) {
    const key = `otp:${email}`
    const savedOtp = await this.redis.get(key);
    const otp = dto.otpCode;
    const limitKey = `otp-limit:${email}`

    if (!savedOtp || savedOtp !== otp) {
      throw new ConflictException('Invalid or expired OTP');
    }

    const isValidOtp = await this.comparePassword(otp,savedOtp)
    if(!isValidOtp){
      throw new ConflictException('Invalid or Expired OTP')
    }
    await this.usersService.markAsVerified(email); 
    await this.redis.del(key);
    await this.redis.del(limitKey);

    return { message: 'Email verified successfully' };
  }

  async resendOtp(email: string) {

    const key = `otp:${email}`
    const limitKey = `otp-limit:${email}`

    console.log(email)
    const user = await this.usersService.findByEmail(email)
    console.log(user)
    if(!user) throw new NotFoundException('User not found')
    if(user.isAccountVerified) throw new ConflictException('Account already verified')
    
    const requestCount = await this.redis.get(limitKey)
    if(requestCount && parseInt(requestCount)>= 3){
      const limitLeft = await this.redis.ttl(limitKey)
      const minutes = Math.ceil(limitLeft/60)
       throw new BadRequestException(`Too many requests. Please try again after ${minutes} minutes`)

    }

    const otpTtl = await this.redis.ttl(key)
    if(otpTtl > 240){
      throw new BadRequestException(`Please wait ${otpTtl - 240} seconds`)
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    try{
      const hashedOtp = await bcrypt.hash(
              otp,
              10,
            );
      await this.redis.set(key, hashedOtp, 'EX', 300)
      if(!requestCount){
        await this.redis.set(limitKey,1,'EX',3600)
      }else{
        const multi = this.redis.multi();

      multi.incr(limitKey);
      multi.expire(limitKey, 3600);

      await multi.exec();
      }
      await this.mailQueue.add(
        'send-otp',
        {
          email,
          otp,
      },{
        attempts:3,
        backoff:{
          type:'exponential',
          delay:3000,
        },
        removeOnComplete:100,
        removeOnFail:50
      })
      return{
        message:'A new verification code has been sent'
      }
    }catch(error){
      throw new InternalServerErrorException('Action failed')
    }
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

    if(!user.isAccountVerified) throw new UnauthorizedException('Please verify your account first  ')
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
    return tokens;
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
  private async generateVerifyToken(email:string){
    return await this.jwtService.signAsync(
      { email:email, type: 'verify' },
      { 
        secret:this.configService.get<string>('jwt.verifyTokenSecret'),
        expiresIn: '10m' })
  }
  private getUserRoles(user: any): Role[] {
  return Array.isArray(user.role)
  ? user.role
  : [user.role || Role.STUDENT];
  }
  private async comparePassword(plain: string, hashed: string) {
    return bcrypt.compare(plain, hashed);
  }
}
