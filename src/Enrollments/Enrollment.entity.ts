import { Course } from "src/courses/course.entity";
import { User } from "src/User/user.entity";
import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn } from "typeorm";

@Entity('course_students')
export class Enrollment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 'ACTIVE' })
  status: 'ACTIVE' | 'PENDING' | 'DROPPED';

  @CreateDateColumn()
  enrolledAt: Date;
  
  @ManyToOne(() => User)
  student: User;

  @ManyToOne(() => Course)
  course: Course;
}
