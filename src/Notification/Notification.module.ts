import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EnrollmentModule } from "src/Enrollments/Enrollment.module";
import { Notification } from "./Notification.entity";
import { Enrollment } from "src/Enrollments/Enrollment.entity";
import { NotificationService } from "./Notification.service";
import { AssignmentCreatedListener } from "./Listener/assignment-created.listener";
import { User } from "src/User/user.entity";
import { NotificationGateway } from "./Notification.gateway";
import { EnrollmentCreatedListener } from "./Listener/enrollment-created.listener";

@Module({
    imports:[EnrollmentModule,TypeOrmModule.forFeature([Notification,Enrollment,User])],
    exports:[],
    controllers:[],
    providers:[NotificationService, EnrollmentCreatedListener,AssignmentCreatedListener,NotificationGateway]
})
export class NotificationModule{}