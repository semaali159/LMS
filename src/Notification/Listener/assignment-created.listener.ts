import { OnEvent } from '@nestjs/event-emitter';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationType } from 'src/common/enums/notificationType.enum';
import { Enrollment } from 'src/Enrollments/Enrollment.entity';
import { NotificationService } from '../Notification.service';

@Injectable()
export class AssignmentCreatedListener {
  constructor(
    private notificationService:NotificationService,

    @InjectRepository(Enrollment)
    private enrollmentRepo: Repository<Enrollment>,
  ) {}

  @OnEvent('assignment.created')
  async handleAssignmentCreated(payload: {
    assignmentId: number;
    courseId: number;
    title: string;
  }) {
    const enrollments = await this.enrollmentRepo.find({
      where: { course: { id: payload.courseId } },
      relations: ['student'],
    });
for(const enroll of enrollments ){
  await this.notificationService.create({
    userId: enroll.student.id,
    title: "New Assignment",
    message:`New assignment: ${payload.title}`,
type:NotificationType.ASSIGNMENT,
sourceType:NotificationType.ASSIGNMENT,
sourceId:payload.assignmentId,
  });
}}
  
}
