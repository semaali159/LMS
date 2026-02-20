import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentProfile } from './entities/student-profile.entity';
import { InstructorProfile } from './entities/instructor-profile.entity';
import { User } from '../User/user.entity';
@Injectable()
export class ProfilesService {
constructor(
@InjectRepository(StudentProfile) private studentRepo:
Repository<StudentProfile>,
@InjectRepository(InstructorProfile) private instructorRepo:
Repository<InstructorProfile>,
@InjectRepository(User) private usersRepo: Repository<User>,
) {}
async createStudentProfile(userId: string, gradeLevel?: string) {
const user = await this.usersRepo.findOne({ where: { id: userId } });
if(!user)  throw new NotFoundException()
const profile = this.studentRepo.create({ user: { id: user.id }, gradeLevel });
return this.studentRepo.save(profile);
}
async createInstructorProfile(userId: string, specialty?: string) {
const user = await this.usersRepo.findOne({ where: { id: userId } });
if(!user)  throw new NotFoundException()
const profile = this.instructorRepo.create({  user: { id: user.id }, specialty });
return this.instructorRepo.save(profile);
}
}
