import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from 'src/common/enums/roles.enum';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private userRepository: Repository<User>) {}

  async create(
    email: string,
    password: string,
    username: string,
    role?: Role
  ) {
const alreadyUser =await this.findByEmail(email)
if( alreadyUser)  throw new BadRequestException('user already exist');
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      username,
      role
    })
    return await this.userRepository.save(user);
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({ where:{email} });
  }

  async findById(id: string) {
    return this.userRepository.findOne({where:{id}});
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
const user=await this.findById(userId)
    if(!user)  throw new BadRequestException('user already exist');
   
  user.refreshToken = await bcrypt.hash(refreshToken, 10);
  await this.userRepository.save(user);
  }

  async removeRefreshToken(userId: string) {
        const user=await this.findById(userId)
    if(!user)  throw new BadRequestException('user already exist');
   user.refreshToken= undefined;
    await this.userRepository.save(user);
  }
}
