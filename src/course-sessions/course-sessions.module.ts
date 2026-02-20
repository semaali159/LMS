import { Module } from "@nestjs/common";
import { UsersModule } from "src/User/user.module";
import { CourseSession } from "./entities/course-session.entity";
import { CourseSessionsService } from "./course-session.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CourseSessionsController } from "./course-sessions.controller";
import { Course } from "src/courses/course.entity";
import { CourseSessionSchedule } from "./entities/course-session-schedual";
import { CourseModule } from "src/courses/course.module";
import { User } from "src/User/user.entity";

@Module({imports:[UsersModule,CourseModule,TypeOrmModule.forFeature([User,CourseSession,Course,CourseSessionSchedule])],
    providers:[CourseSessionsService],controllers:[CourseSessionsController],exports:[CourseSessionsService]})
    export class CourseSessionsModule {}