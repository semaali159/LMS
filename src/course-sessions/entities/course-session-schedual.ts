import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Course } from '../../courses/course.entity';
import { WeekDay } from '../../common/enums/week-day.enum';

@Entity()
export class CourseSessionSchedule {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Course, (course) => course.schedules, { onDelete: 'CASCADE' })
  course: Course;

  @Column({ type: 'enum', enum: WeekDay })
  day: WeekDay;

  @Column()
  startTime: string; // "19:00"

  @Column()
  endTime: string;   // "21:00"
}
