import { QuestionType } from 'src/common/enums/questionType.enum';
import {
    Column,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
  } from 'typeorm'
import { Quiz } from './quiz.entity';
import { QuizQuestionOptions } from './quiz-options.entity';
@Entity()
export class QuizQuestion{
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({ type: 'text' })
    questionText: string;

    @Column({type:'enum', enum:QuestionType, default:QuestionType.MULTIPLE_CHOICE})
    questionType: QuestionType

    @Column({type:'int'})
    points:number

    @Column({type:'text', nullable:true})
    correctAnswer?: string

    @ManyToOne(()=> Quiz, (quiz)=> quiz.questions, {onDelete:'CASCADE'})
    quiz: Quiz

    @OneToMany(()=> QuizQuestionOptions,( options)=> options.question, {cascade:true})
    options: QuizQuestionOptions[]
}