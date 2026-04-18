import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Notification } from "./Notification.entity";
import { In, Repository } from "typeorm";
import { CreateNotificationDto } from "./dtos/notification.dto";
import { User } from "src/User/user.entity";
import { NotificationGateway } from "./Notification.gateway";
import { NotificationType } from "src/common/enums/notificationType.enum";
import { Assignment } from "src/assignment/assignment.entity";
import { CourseAnnouncement } from "src/course-announcements/entities/course-announcement.entity";
import { Enrollment } from "src/Enrollments/Enrollment.entity";

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly NotificationRepository: Repository<Notification>,
    @InjectRepository(User) private readonly UserRepository: Repository<User>,
    @InjectRepository(Assignment)
    private readonly assignmentRepo: Repository<Assignment>,
    @InjectRepository(CourseAnnouncement)
    private readonly announcementRepo: Repository<CourseAnnouncement>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async create(dto: CreateNotificationDto) {
    const user = await this.UserRepository.findOne({ where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException("user not found");
    }
    const notification = this.NotificationRepository.create({
      user,
      title: dto.title,
      message: dto.message,
      type: dto.type,
      sourceType: dto.sourceType,
      sourceId: dto.sourceId,
    });
    const saved = await this.NotificationRepository.save(notification);
    this.notificationGateway.server
      .to(`user-${user.id}`)
      .emit("notification:new", saved);

    return saved;
  }
 
  async deleteAllForCourse(courseId: number): Promise<void> {
    const [assignments, announcements, enrollments] = await Promise.all([
      this.assignmentRepo.find({
        where: { course: { id: courseId } },
        select: { id: true },
      }),
      this.announcementRepo.find({
        where: { course: { id: courseId } },
        select: { id: true },
      }),
      this.enrollmentRepo.find({
        where: { course: { id: courseId } },
        select: { id: true },
      }),
    ]);

    const tasks: Promise<unknown>[] = [];

    if (assignments.length) {
      tasks.push(
        this.NotificationRepository.delete({
          type: NotificationType.ASSIGNMENT,
          sourceId: In(assignments.map((a) => a.id)),
        }),
      );
    }
    if (announcements.length) {
      tasks.push(
        this.NotificationRepository.delete({
          type: NotificationType.ANNOUNCEMENT,
          sourceId: In(announcements.map((a) => a.id)),
        }),
      );
    }
    if (enrollments.length) {
      tasks.push(
        this.NotificationRepository.delete({
          type: NotificationType.ENROLLMENT,
          sourceId: In(enrollments.map((e) => e.id)),
        }),
      );
    }

    await Promise.all(tasks);
  }

  async getAll(userId: string) {
    const user = await this.UserRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("user not found");
    }
    const notifications = await this.NotificationRepository.find({
      where: { user: { id: userId } },
    });
    if (!notifications) {
      throw new NotFoundException("there is no notification yet");
    }
  }

  async getNotificationById(notificationId:number, userId: string){
    const notification = await this.NotificationRepository.findOne({
      where:{id:notificationId},
      relations:['user']
    })

    if(notification?.user.id !== userId){
      throw new ForbiddenException('you are not allowed to access this notification')
    }
    if(!notification){
      throw new NotFoundException('Notification not found')
    }
    return notification
  }
}
