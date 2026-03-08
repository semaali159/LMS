import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Course } from 'src/courses/course.entity';
import { Quiz } from 'src/quiz/entities/quiz.entity';

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

  @OneToMany(()=> Quiz, (quiz)=> quiz.session,{cascade: true})
  quizzes: Quiz[]
}
