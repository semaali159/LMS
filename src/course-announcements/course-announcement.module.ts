import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EnrollmentModule } from "src/Enrollments/Enrollment.module";
import { CourseAnnouncement } from "./entities/course-announcement.entity";
import { CourseAnnouncementRead } from "./entities/course-announcement-read.entity";
import { Course } from "src/courses/course.entity";
import { Enrollment } from "src/Enrollments/Enrollment.entity";
import { User } from "src/User/user.entity";
import { CourseAnnouncementController } from "./course-announcement.controller";
import { CourseAnnouncementService } from "./course-announcement.service";

@Module({
  imports: [
    EnrollmentModule,
    TypeOrmModule.forFeature([
      CourseAnnouncement,
      CourseAnnouncementRead,
      Course,
      Enrollment,
      User,
    ]),
  ],
  controllers: [CourseAnnouncementController],
  providers: [CourseAnnouncementService],
  exports: [CourseAnnouncementService],
})
export class CourseAnnouncementModule {}
