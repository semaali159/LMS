import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Course } from "src/courses/course.entity";
import { User } from "src/User/user.entity";
import { EnrollmentService } from "./Enrollment.service";
import { Enrollment } from "./Enrollment.entity";

@Module({imports:[TypeOrmModule.forFeature([Course,User,Enrollment])],exports:[EnrollmentService],controllers:[],providers:[EnrollmentService]})
export class EnrollmentModule{}