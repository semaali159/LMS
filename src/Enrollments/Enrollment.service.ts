import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Enrollment } from "./Enrollment.entity";
import { plainToInstance } from "class-transformer";
import { EnrollCourseResponseDto } from "src/courses/dtos/course-response.dto";
import { User } from "src/User/user.entity";
import { Course } from "src/courses/course.entity";
import { EventEmitter2 } from "@nestjs/event-emitter";

@Injectable()
export class EnrollmentService {
  constructor(
    
      private eventEmitter: EventEmitter2,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
       @InjectRepository(Course)private readonly CourseRepository:Repository<Course>,
        @InjectRepository(User) private readonly UserRepository: Repository<User>  
  ) {}

  async getActiveEnrollmentOrFail(
    studentId: string,
    courseId: number,
  ): Promise<Enrollment> {
    const enrollment = await this.enrollmentRepo.findOne({
      where: {
        student: { id: studentId },
        course: { id: courseId },
        status: 'ACTIVE',
      },
      relations: ['student', 'course'],
    });

    if (!enrollment) {
      throw new ForbiddenException('Student is not enrolled in this course');
    }

    return enrollment;
  }
async getTeacherIdByEnrollmentId(enrollmnetId:number){
const enrollment = await this.enrollmentRepo.findOne({where:{id:enrollmnetId},relations:['course','course.teacher']})
if(!enrollment){
   throw new NotFoundException("enrollment not found")
}
return enrollment.course.instructor.id;
}

async enroll(courseId: number, studentId: string) {
    const student = await this.UserRepository.findOne({ where: { id: studentId } });

    if (!student || student.role !== 'student') {
      throw new ForbiddenException('Only students can enroll');
    }

    const course = await this.CourseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) throw new NotFoundException('Course not found');
    const existing = await this.enrollmentRepo.findOne({
      where:{student:{id:studentId},
       course:{id:courseId}}})
    if(existing){ throw new BadRequestException('already enrolled')}
    const enrollment = this.enrollmentRepo.create({
      student,course,status:'PENDING'
    })
    const savedEnrollment= await this.enrollmentRepo.save(enrollment)
this.eventEmitter.emit('enrollment.created',{enrollmentId:savedEnrollment.id,studentName:student.username})
console.log(savedEnrollment)
return plainToInstance(EnrollCourseResponseDto,savedEnrollment,  { excludeExtraneousValues: true })  
}

async getAllPendingEnrollment(courseId:number,instructorId: string){
    const course = await this.CourseRepository.findOne({
    where: { id: courseId, instructor: { id: instructorId } },
  });

  if (!course) throw new ForbiddenException();

  const enrollments = await this.enrollmentRepo.find({
    where:{
      course:{id:courseId},
      status:"PENDING"
    },
    relations:['student']
  })
  if(!enrollments){
    throw new NotFoundException('there is no pending enrollment')
  }
  return enrollments

}
async accepteEnrollment(EnrollmentId:number, instructorId:string){
  const enrollment = await  this.enrollmentRepo.findOne({
    where:{
      id:EnrollmentId
    },relations:['course','course.instructor']
  })
  if(!enrollment){
    throw new NotFoundException('enrollment not found')
  }
  if(enrollment.course.instructor.id !== instructorId){
    throw new BadRequestException('not allowed only instructor themself')
  }
  enrollment.status = 'ACTIVE'
return await this.enrollmentRepo.save(enrollment)
}

async rejectEnrollment(EnrollmentId:number, instructorId:string){
   const enrollment = await  this.enrollmentRepo.findOne({
    where:{
      id:EnrollmentId
    },relations:['course','course.instructor']
  })
  if(!enrollment){
    throw new NotFoundException('enrollment not found')
  }
  if(enrollment.course.instructor.id !== instructorId){
    throw new BadRequestException('not allowed only instructor themself')
  }
  enrollment.status = 'DROPPED'
return await this.enrollmentRepo.save(enrollment)

}

async getEnrolledCourses(studentId: string) {

  const student = await this.UserRepository.findOne({
    where: { id: studentId }
  });

  if (!student) throw new NotFoundException('Student not found');
  if (student.role !== 'student')
    throw new ForbiddenException('Only students can view enrolled courses');
const enrollments = await this.enrollmentRepo.find({
  where:{
    student:{id:studentId},
    status:'ACTIVE'
  },
  relations:['course','course.teacher']
})
return enrollments.map(e=> e.course)
 
}

}
