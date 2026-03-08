import { Assignment } from '../assignment/assignment.entity';
import { User } from 'src/User/user.entity';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Submission {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, {
    eager: true,
    onDelete: 'CASCADE',
  })
  student: User;

  @ManyToOne(() => Assignment, (a) => a.submissions, {
    onDelete: 'CASCADE',
  })
  assignment: Assignment;

  @Column()
  fileUrl: string;

  @Column()
  filePublicId: string;

  @Column({ type: 'int', nullable: true })
  grade?: number;

  @Column({ nullable: true })
  feedback?: string;

  @CreateDateColumn()
  submittedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
