import { EnrollmentStatus } from "src/common/enums/enrollmentStatus.enum";
import { Course } from "src/courses/course.entity";
import { User } from "src/User/user.entity";
import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, Index } from "typeorm";

@Entity('course_students')
@Index(['student', 'course'], { unique: true })
export class Enrollment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type:'enum', enum: EnrollmentStatus, default: EnrollmentStatus.PENDING })
  status: EnrollmentStatus

  @Column({ type: 'int', nullable: true, default: null })
  waitlistPosition: number | null;

  @Column({ type: 'timestamp', nullable: true, default: null })
  rejectedAt: Date | null;

  @CreateDateColumn()
  enrolledAt: Date;
  
  @ManyToOne(() => User)
  student: User;

  @ManyToOne(() => Course, { onDelete: "CASCADE" })
  course: Course;
}
