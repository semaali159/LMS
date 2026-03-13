import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Course } from "src/courses/course.entity";
import { User } from "src/User/user.entity";
import { EnrollmentService } from "./Enrollment.service";
import { Enrollment } from "./Enrollment.entity";
import { EnrollementController } from "./Enrollment.controller";

@Module({imports:[TypeOrmModule.forFeature([Course,User,Enrollment])],exports:[EnrollmentService],controllers:[EnrollementController],providers:[EnrollmentService]})
export class EnrollmentModule{}