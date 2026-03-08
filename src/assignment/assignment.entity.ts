import { Course } from 'src/courses/course.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { Submission } from '../submission/submission.entity';
import { SubmissionType } from 'src/common/enums/submission-type';

@Entity()
export class Assignment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  fileUrl?: string;

  @Column({ nullable: true })
  filePublicId?: string;

  @Column({ type: 'timestamp', nullable: true })
  dueDate?: Date;
@Column({
    type: 'enum',
    enum: SubmissionType,
    default: SubmissionType.FILE,
  })
  submissionType: SubmissionType;
  @ManyToOne(() => Course, (course) => course.assignments, {
    onDelete: 'CASCADE',
  })
  course: Course;

  @OneToMany(() => Submission, (s) => s.assignment)
  submissions: Submission[];

  @CreateDateColumn()
  createdAt: Date;
}
