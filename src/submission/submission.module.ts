import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Submission } from './submission.entity';
import { SubmissionService } from './submission.service';
import { SubmissionController } from './submission.controller';
import { Assignment } from '../assignment/assignment.entity';
import { User } from 'src/User/user.entity';
// import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { EnrollmentModule } from 'src/Enrollments/Enrollment.module';
import { StorageService } from 'src/common/services/upload/upload.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Submission, Assignment, User]),
    // CloudinaryModule,
    EnrollmentModule
  ],
  controllers: [SubmissionController],
  providers: [SubmissionService,StorageService],
})
export class SubmissionModule {}
