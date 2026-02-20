import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Course } from 'src/courses/course.entity';

@Entity()
export class CourseSession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'time', nullable: true })
  startTime?: string;

 @Column()
  endTime: string;

  @Column({ type: 'int' })
  sessionNumber: number;
  @ManyToOne(() => Course, (course) => course.sessions, { onDelete: 'CASCADE' })
  course: Course;
}
