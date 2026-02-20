import { Module } from "@nestjs/common";
import { User } from "src/User/user.entity";
import { UsersModule } from "src/User/user.module";
import { Course } from "./course.entity";
import { CourseService } from "./course.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CourseController } from "./course.controller";
import { CourseSessionSchedule } from "src/course-sessions/entities/course-session-schedual";
import { CourseSession } from "src/course-sessions/entities/course-session.entity";
// import { EnrollmentModule } from "src/Enrollments/Enrollment.module";
// import { Enrollment } from "src/Enrollments/Enrollment.entity";

@Module({imports:[UsersModule,
    // EnrollmentModule,Enrollment,
    TypeOrmModule.forFeature([Course,User,CourseSessionSchedule,CourseSession,])],
    providers:[CourseService],controllers:[CourseController],exports:[CourseService]})
    export class CourseModule{}