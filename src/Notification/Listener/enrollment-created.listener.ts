import { Injectable, NotFoundException } from "@nestjs/common";
import { NotificationService } from "../Notification.service";
import { OnEvent } from "@nestjs/event-emitter";
import { EnrollmentService } from "src/Enrollments/Enrollment.service";
import { NotificationType } from "src/common/enums/notificationType.enum";

@Injectable()
export class EnrollmentCreatedListener{
  constructor(private readonly notificationService : NotificationService,
    private readonly enrollementService: EnrollmentService
  ){}
  @OnEvent('enrollment.created')
  async handleEnrollmentCreated(payload:{enrollmentId:number,studentName:string}
    
  ){
    const teacherId = await this.enrollementService.getTeacherIdByEnrollmentId(payload.enrollmentId)
    if(!teacherId){ throw new NotFoundException("teacher not found") }  
    const saved = await this.notificationService.create({
            userId:teacherId,
            title:"New Enrollment",
            message:`${payload.studentName} enroll your course`,
            type:NotificationType.ENROLLMENT,
            sourceType:NotificationType.ENROLLMENT,
            sourceId:payload.enrollmentId

        })
  }
}