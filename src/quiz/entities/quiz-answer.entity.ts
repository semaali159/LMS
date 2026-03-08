import {
    Column,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    CreateDateColumn,
  } from 'typeorm';
import { Quiz } from './quiz.entity';
import { User } from 'src/User/user.entity';
import { QuizAnswerDetails } from './quiz-answer-details.entity';


  @Entity()
export class QuizAnswer{

  @PrimaryGeneratedColumn()
  id: number;

  @Column({type:'int', default:0})
  totalScore:number

  @Column({type:'int', default:0})
  maxScore: number

  @Column({ type: 'timestamp', nullable: true })
  submittedAt?: Date;

  @Column({ default: false })
  isSubmitted: boolean;

  @CreateDateColumn()
  startedAt: Date;

  @ManyToOne(() => Quiz, (quiz) => quiz.answers, {
    onDelete: 'CASCADE',
  })
  quiz: Quiz;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  student: User;

  @OneToMany(() => QuizAnswerDetails, (detail) => detail.answer, {
    cascade: true,
  })
  details: QuizAnswerDetails[];


}