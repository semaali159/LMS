import { CourseSession } from 'src/course-sessions/entities/course-session.entity';
import { 
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn
} from 'typeorm'
import { QuizQuestion } from './quiz-question.entity';
import { QuizAnswer } from './quiz-answer.entity';


@Entity()
export class Quiz{
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column({ nullable: true })
  description?: string;

  @Column({type:'int', default:0})
  totalPoints:number

  @Column({type:'timestamp'})
  startTime: Date

  @Column({type:'timestamp'})
  endTime: Date

  @Column({type:'int', nullable:true})
  durationMinutes?:number

  @Column({default:false})
  showResultImmediately:boolean
  
  @CreateDateColumn()
    createdAt: Date;

  @ManyToOne(()=> CourseSession,(session)=> session.quizzes,{onDelete:'CASCADE'})
  session: CourseSession

  @OneToMany(()=> QuizQuestion, (question)=> question.quiz , {cascade:true})
  questions:QuizQuestion[]

  @OneToMany(()=> QuizAnswer, (answer)=> answer.quiz, {cascade: true})
  answers: QuizAnswer[]

}

