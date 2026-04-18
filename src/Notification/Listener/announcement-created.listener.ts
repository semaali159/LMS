import { Injectable } from "@nestjs/common";
import { NotificationService } from "../Notification.service";
import { CourseAnnouncementService } from "src/course-announcements/course-announcement.service";
import { OnEvent } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { Enrollment } from "src/Enrollments/Enrollment.entity";
import { Repository } from "typeorm";
import { NotificationType } from "src/common/enums/notificationType.enum";

@Injectable()
export class AnnouncementCreatedListener{
    constructor(
        private readonly notificationService:NotificationService,
        @InjectRepository(Enrollment)
        private enrollmentRepo: Repository<Enrollment>,
         
    ){}

    @OnEvent('announcement-created')
    async handleAnnouncementCreated(payload:{
        announcementId: number;
    courseId: number;
    title: string;
    }){
        const enrollments = await this.enrollmentRepo.find({
            where: {course:{id: payload.courseId}, status:'ACTIVE'},
            relations:['student']
        })
        await Promise.all(enrollments.map((enroll)=>
            this.notificationService.create({
                userId: enroll.student.id,
                title: 'New Announcement',
                message: `New Announcement: ${payload.title}`,
                type:NotificationType.ANNOUNCEMENT,
                sourceType:NotificationType.ANNOUNCEMENT,
                sourceId:payload.announcementId
            }))
        )
    }
}