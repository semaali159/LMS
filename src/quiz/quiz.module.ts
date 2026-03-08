import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quiz } from './entities/quiz.entity';
import { QuizQuestion } from './entities/quiz-question.entity';
import { QuizQuestionOptions } from './entities/quiz-options.entity';
import { QuizAnswer } from './entities/quiz-answer.entity';
import { QuizAnswerDetails } from './entities/quiz-answer-details.entity';
import { CourseSession } from 'src/course-sessions/entities/course-session.entity';
import { User } from 'src/User/user.entity';
import { Enrollment } from 'src/Enrollments/Enrollment.entity';
import { EnrollmentModule } from 'src/Enrollments/Enrollment.module';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Quiz,
      QuizQuestion,
      QuizQuestionOptions,
      QuizAnswer,
      QuizAnswerDetails,
      CourseSession,
      User,
      Enrollment,
    ]),
    EnrollmentModule,
  ],
  controllers: [QuizController],
  providers: [QuizService],
  exports: [QuizService],
})
export class QuizModule {}