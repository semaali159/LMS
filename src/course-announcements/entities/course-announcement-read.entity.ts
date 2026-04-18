import { User } from 'src/User/user.entity';
import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { CourseAnnouncement } from './course-announcement.entity';

@Entity('course_announcement_reads')
@Unique(['announcement', 'user'])
export class CourseAnnouncementRead {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => CourseAnnouncement, (a) => a.reads, { onDelete: 'CASCADE' })
  announcement: CourseAnnouncement;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  readAt: Date;
}
