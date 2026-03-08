import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { QuizQuestion } from './quiz-question.entity';
@Entity()
export class QuizQuestionOptions{
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column()
    text: string;

    @Column({default:false})
    isCorrrect: boolean

    @ManyToOne(()=> QuizQuestion, (question)=> question.options, {onDelete:'CASCADE'})
    question: QuizQuestion
}