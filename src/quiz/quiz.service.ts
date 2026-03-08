import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Quiz } from "./entities/quiz.entity";
import { InjectRepository } from "@nestjs/typeorm";
import {Repository} from 'typeorm'
import { QuizAnswer } from "./entities/quiz-answer.entity";
import { QuizQuestion } from "./entities/quiz-question.entity";
import { CourseSession } from "src/course-sessions/entities/course-session.entity";
import { Enrollment } from "src/Enrollments/Enrollment.entity";
import { EnrollmentService } from "src/Enrollments/Enrollment.service";
import { CreateQuizDto } from "./dtos/create-quiz.dto";
import { CreateAnswerDto } from "./dtos/create-quiz-answer.dto";
import { SubmitQuizDto } from "./dtos/create-quiz-submission.dto";
import { QuestionType } from "src/common/enums/questionType.enum";
import { isContext } from "vm";
@Injectable()
export class QuizService{
constructor(
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    
    @InjectRepository(QuizAnswer)
    private readonly quizAnswerRepository: Repository<QuizAnswer>,
    
    @InjectRepository(QuizQuestion)
    private readonly quizQuestionRepository: Repository<QuizQuestion>,
    
    @InjectRepository(CourseSession)
    private readonly sessionRepository: Repository<CourseSession>,
    
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    
    private readonly enrollmentService: EnrollmentService,

){}

async create(dto:CreateQuizDto, instructorId: string){
    const session = await this.sessionRepository.findOne({
        where: { id: dto.sessionId },
        relations: ['course', 'course.instructor'],
      });
  
      if (!session) {
        throw new NotFoundException('Session not found');
      }
  
      if (session.course.instructor.id !== instructorId) {
        throw new ForbiddenException('Only course instructor can create quizzes');
      }
  
      
      const quizStartTime = new Date(dto.startTime);
      const sessionEndDateTime = this.combineDateAndTime(
        new Date(session.date),
        session.endTime
      );
  
      if (quizStartTime <= sessionEndDateTime) {
        throw new BadRequestException(
          `Quiz start time must be after session end time. Session ends at ${sessionEndDateTime.toISOString()}`
        );
      }
  
      
      const quizEndTime = new Date(dto.endTime);
      if (quizEndTime <= quizStartTime) {
        throw new BadRequestException('Quiz end time must be after start time');
      }
  
      
      if (dto.durationMinutes) {
        const calculatedDuration = (quizEndTime.getTime() - quizStartTime.getTime()) / (1000 * 60);
        if (Math.abs(calculatedDuration - dto.durationMinutes) > 1) {
          throw new BadRequestException(
            `Duration minutes (${dto.durationMinutes}) doesn't match the time difference between start and end`
          );
        }
      }
  
      const totalPoints = dto.questions.reduce(
        (sum, q) => sum + q.points,
        0,
      );
  
      const quiz = this.quizRepository.create({
        title: dto.title,
        description: dto.desription,
        startTime: quizStartTime,
        endTime: quizEndTime,
        durationMinutes: dto.durationMinutes,
        showResultImmediately: dto.showResultsImmediately ?? false,
        totalPoints,
        session,
        questions: dto.questions.map((qDto) => ({
          questionText: qDto.questionText,
          questionType: qDto.questionType,
          points: qDto.points,
          correctAnswer: qDto.correctAnswer,
          correctOptionId: qDto.correctOptionId,
          options: qDto.options?.map((opt) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
          })),
        })),
      });
  
      return this.quizRepository.save(quiz);
    

}
async getBySessionId(sessionId:number, studentId?: string){
    const session = await this.sessionRepository.findOne({
        where: { id: sessionId },
        relations: ['course'],
    });

    if (!session) {
        throw new NotFoundException('Session not found');
    }

    if (studentId) {
        await this.enrollmentService.getActiveEnrollmentOrFail(
            studentId,
            session.course.id,
        );
    }

    return await this.quizRepository.find({
        where:{session:{id: sessionId}},
        relations:['questions',]
    })
}
 async getOne(quizId: number, studentId?: string){
    const quiz=  await this.quizRepository.findOne({
        where:{id:quizId},
        relations:['questions','questions.options','session','session.course']
    })
    if(!quiz){
        throw new NotFoundException("Quiz not found")
    }

    if (studentId) {
        await this.enrollmentService.getActiveEnrollmentOrFail(
            studentId,
            quiz.session.course.id,
        );
    }

    return quiz
 }
 async startQuiz(quizId: number, studentId: string){
    const quiz = await this.getOne(quizId, studentId) 
    
    const now = new Date()
    const sessionEndTimeDateTime = this.combineDateAndTime(new Date(quiz.session.date),quiz.session.endTime)
    if(now< sessionEndTimeDateTime){
        throw new BadRequestException(`quiz is not available yet. Session ends at ${sessionEndTimeDateTime.toISOString()}`)
    } 
    if(now < quiz.startTime){
        throw new BadRequestException(`Quiz has not started yet`)
    }
  
      if (now > quiz.endTime) {
        throw new BadRequestException('Quiz has ended');
      }
      const exisitingAnswer = await this.quizAnswerRepository.findOne({
        where:{quiz:{id:quizId}, student:{id:studentId}}
      })
      if(exisitingAnswer){
        throw new BadRequestException(`Quiz alrady submitted`)
      }
      const answer = this.quizAnswerRepository.create({
        quiz,
        student:{id:studentId},
        maxScore: quiz.totalPoints,
        isSubmitted:false
      })
      return this.quizAnswerRepository.save(answer)
}
 async submitAnswer(quizId: number,studentId:string, dto: SubmitQuizDto){
    const quiz = await this.getOne(quizId, studentId) 
    const now = new Date()
    if(now > quiz.endTime){
        throw new BadRequestException('Quiz has ended')
    }
    const answer = await this.quizAnswerRepository.findOne({
        where:{quiz:{id:quizId}, student:{id:studentId}},
        relations:['details','details.options']
    })
    if(!answer){
        throw new BadRequestException('quiz answer not found pleas start quiz first')
    }
    if(answer.isSubmitted){
        throw new BadRequestException('answer already submitted')
    }
    let totalScore=0
    const details = dto.answers.map((ansdto)=>{
        const question  = quiz.questions.find((q)=>{
            q.id === ansdto.questionId
        })
        if(!question) return null
        let pointsEarned = 0
        if(question.questionType === QuestionType.MULTIPLE_CHOICE){
            const selectOption = question.options.find((opt)=>opt.id === ansdto.selectedOptionId)
            if(selectOption?.isCorrrect){
                pointsEarned = question.points
            }

        } else if (question.questionType === QuestionType.TRUE_FALSE){
            if(ansdto.isCorrect === (question.correctAnswer === 'true')){
                pointsEarned = question.points
            }
        }else if(question.questionType === QuestionType.SHORT_ANSWER){
            if(ansdto.answerTexr.toLowerCase().trim() === question.correctAnswer?.toLowerCase().trim()){
                pointsEarned = question.points
            }
        }
        totalScore += pointsEarned
        return {
            answer,
            question,
            answeText: ansdto.answerTexr,
            selectedOptionId: ansdto.selectedOptionId,
            isCorrect: ansdto.isCorrect,
            pointsEarned

        }
    }).filter(Boolean)

    answer.details = details as any;
    answer.totalScore = totalScore;
    answer.isSubmitted = true;
    answer.submittedAt = now;

    return this.quizAnswerRepository.save(answer);
  
 
}
async getStudentResult(quizId: number,studentId:string){
    const quiz = await this.getOne(quizId, studentId) 
    
    const answer = await this.quizAnswerRepository.findOne({
        where:{quiz:{id:quizId}, student:{id: studentId}},
        relations:['details', 
             'details.question',
            'details.selectedOption',
            'quiz',
            'quiz.questions',
            'quiz.questions.options',
            'quiz.session',]
    })
    if(!answer){
        throw new NotFoundException('quiz answer not found')
    }
    return answer
}
async getAllResult(quizId: number,instructorId:string){
    const quiz = await this.getOne(quizId)
    if(quiz.session.course.instructor.id !== instructorId){
        throw new BadRequestException('Only instructor can show all his quiz result')
    }
    return this.quizAnswerRepository.find({
        where:{quiz:{id:quizId}},
        relations: ['student', 'details', 'details.question'],
    })

}
private combineDateAndTime(date: Date, timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined;
  }

}