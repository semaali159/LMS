import {
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
  } from 'typeorm';
import { QuizQuestion } from './quiz-question.entity';
import { QuizAnswer } from './quiz-answer.entity';
import { QuizQuestionOptions } from './quiz-options.entity';

   @Entity()
   export class QuizAnswerDetails{

    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({ type: 'text', nullable: true })
    answerText?: string;

    @Column({type:'int',nullable:true})
    selectedOptionId?: number

    @Column({ nullable: true })
    isCorrect?: boolean;

    @Column({type:'int', default:0})
    pointsEarned:number

    @ManyToOne(() => QuizAnswer, (answer) => answer.details, {
        onDelete: 'CASCADE',
      })
      answer: QuizAnswer;
    
      @ManyToOne(() => QuizQuestion, { onDelete: 'CASCADE' })
      question: QuizQuestion;
    
      @ManyToOne(() => QuizQuestionOptions, { nullable: true })
      selectedOption?: QuizQuestionOptions;
    
  
   }