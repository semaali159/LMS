import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentProfile } from './entities/student-profile.entity';
import { InstructorProfile } from './entities/instructor-profile.entity';
import { ProfilesService } from './profile.service';
import { ProfilesController } from './profile.controller';
import { User } from '../User/user.entity';
import { UsersModule } from 'src/User/user.module';
@Module({
imports: [UsersModule,TypeOrmModule.forFeature([StudentProfile, InstructorProfile, User])],
providers: [ProfilesService],
controllers: [ProfilesController],
exports: [ProfilesService],
})
export class ProfilesModule {}
