import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment } from './assignment.entity';
import { AssignmentService } from './assignment.service';
import { AssignmentController } from './assignment.controller';
import { Course } from 'src/courses/course.entity';
// import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { StorageService } from 'src/common/services/upload/upload.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Assignment, Course]),
    // CloudinaryModule,
    EventEmitterModule.forRoot()
  ],
  controllers: [AssignmentController],
  providers: [AssignmentService,StorageService],
  exports: [AssignmentService], 
})
export class AssignmentModule {}
