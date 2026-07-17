import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Course } from "src/courses/course.entity";
import { User } from "src/User/user.entity";
import { EnrollmentService } from "./Enrollment.service";
import { Enrollment } from "./Enrollment.entity";
import { EnrollementController, MyEnrollmentsController } from "./Enrollment.controller";
import { WaitlistService } from "./EnrollmentService/waitlist.service";
import { EnrollmentQueryService } from "./EnrollmentService/EnrollmentQuery.service";
import { EnrollmentAuthService } from "./EnrollmentService/EnrollmentAuth.service";

@Module({
    imports:[TypeOrmModule.forFeature([Course,User,Enrollment])],
    exports:[EnrollmentService],
    controllers:[EnrollementController,MyEnrollmentsController],
    providers:[EnrollmentService, WaitlistService, EnrollmentQueryService, EnrollmentAuthService]})
export class EnrollmentModule{}