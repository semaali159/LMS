import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Enrollment } from "./Enrollment.entity";
import { plainToInstance } from "class-transformer";
import { User } from "src/User/user.entity";
import { Course } from "src/courses/course.entity";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { EnrollCourseResponseDto, EnrolledCourseDto, EnrollmentWithStudentDto } from "./dtos/enrollment.dto";
import { EnrollmentStatus } from "src/common/enums/enrollmentStatus.enum";
import { DataSource } from "typeorm";
import { CourseState } from "src/common/enums/courseState.enum";
import { differenceInDays } from "date-fns";
import { buildOffset, normalizeOffset, offsetPaginationInput } from "src/common/services/pagination";
import { WaitlistService } from "./EnrollmentService/waitlist.service";
import { assertTransition } from "./Enrollment-transitions";

const REJECTION_COOLDOWN_DAYS = 30

@Injectable()
export class EnrollmentService {
  constructor(
    private waitlistService: WaitlistService,
    private eventEmitter: EventEmitter2,
    private readonly dataSource: DataSource,
    @InjectRepository(Enrollment) private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Course)private readonly CourseRepository:Repository<Course>, 
  ) {}

  async getActiveEnrollmentOrFail(
    studentId: string,
    courseId: number,
  ): Promise<Enrollment> {
    const enrollment = await this.enrollmentRepo.findOne({
      where: {
        student: { id: studentId },
        course: { id: courseId },
        status: EnrollmentStatus.ACTIVE,
      },
      relations: ['student', 'course'],
      select:{
        id: true,
        status: true

      }
    });

    if (!enrollment) {
      throw new ForbiddenException('Student is not enrolled in this course');
    }

    return enrollment;
  }
async getTeacherIdByEnrollmentId(enrollmnetId:number){
const enrollment = await this.enrollmentRepo.findOne({
  where:{id:enrollmnetId},
  relations:['course','course.instructor'],
  select:{
    id:true,
    course:{id:true, instructor:{id:true}}
  }
})
if(!enrollment){
   throw new NotFoundException("enrollment not found")
}
return enrollment.course.instructor.id;
}

async enroll(courseId: number, studentId: string) {
    return this.dataSource.transaction(async (manager)=>{
      const course = await manager.findOne(Course,{
        where:{id:courseId},
        select:{
          id:true,
          status: true,
          capacity:true,
          requiresApproval:true
        },
        lock:{mode:'pessimistic_write'}
      })
      if(!course){
        throw new NotFoundException('Course not found')
      }
      if(course.status !== CourseState.PUBLISHED){
        throw new BadRequestException('Course is not available for enrollment')
      }
      await this.reclaimPreviousEnrollments(manager, courseId,studentId)
      let status: EnrollmentStatus
      let waitlistPosition:number | null = null

      if(course.capacity!==null){
        const active = await manager.count(Enrollment,{
          where:{course:{id:courseId},status:EnrollmentStatus.ACTIVE}
        })
        if(active>= course.capacity){
          status = EnrollmentStatus.WAITLISTED
          waitlistPosition = await this.waitlistService.getNextPosition(manager,courseId)
        }else{
          status = course.requiresApproval
          ? EnrollmentStatus.PENDING
          : EnrollmentStatus.ACTIVE
        }
      } else{
        status = course.requiresApproval
        ? EnrollmentStatus.PENDING
        : EnrollmentStatus.ACTIVE;
      }
      try{
        const enrollment = manager.create(Enrollment,{
          student:{id:studentId},
          course:{id:courseId},
          status,
          waitlistPosition
        })
        const saved = await manager.save(enrollment)
        this.eventEmitter.emit('enrollment.created',{
          enrollmentId:saved.id,
          studentId,
          courseId,
          status,
          waitlistPosition
        })
        const full = await manager.findOne(Enrollment,{
          where:{id:saved.id},
          relations:['course'],
          select:{
            id:true,
            status:true,
            enrolledAt:true,
            waitlistPosition:true,
            course:{id:true, title:true}

          }
        })
        return plainToInstance(EnrollCourseResponseDto, full,{
          excludeExtraneousValues:true
        })
      }catch(err){
        if(err.code === '23505'){
          throw new BadRequestException('Already enrolled in this course');
       }
       throw err;
      }

    }) 
   }

async cancelEnrollment(enrollmentId:number, studentId: string){
  return this.dataSource.transaction(async (manager)=>{
    const enrollment = await manager.findOne(Enrollment,{
      where:{id:enrollmentId,student:{id:studentId}},
      relations:['course'],
      select:{
        id:true,
        status:true,
        waitlistPosition:true,
        course:{id:true}
      }
    })
    if(!enrollment){
      throw new NotFoundException('Enrollment not found')
    }
    assertTransition(enrollment.status, EnrollmentStatus.CANCELLED)
    const wasWaitlisted = enrollment.status=== EnrollmentStatus.WAITLISTED
    const cancelledPosition = enrollment.waitlistPosition
    if(wasWaitlisted && cancelledPosition!== null){
      await manager.findOne(Course,{
        where:{id:enrollment.course.id},
        select:{id:true},
        lock:{mode:'pessimistic_write'}
      })
    }

    enrollment.status = EnrollmentStatus.CANCELLED
    enrollment.waitlistPosition = null
    await manager.save(enrollment)
    if(wasWaitlisted && cancelledPosition!== null){
      await this.waitlistService.shiftPositionsDown(manager,enrollment.course.id,cancelledPosition)
    }
    this.eventEmitter.emit('enrollment.cancelled',{
      enrollmentId,
      studentId,
      courseId:enrollment.course.id
    })
    return {message: 'Enrollment cancelled successfully'}
  })
}

async dropEnrollment(enrollmentId:number,studentId:string){
  return this.dataSource.transaction(async (manager)=>{
    const enrollment = await manager.findOne(Enrollment,{
      where:{id:enrollmentId,student:{id:studentId}},
      relations:['course'],
      select:{
        id:true,
        status:true,
        course:{id:true, capacity:true, requiresApproval: true,}
      }
    })
    if(!enrollment) throw new NotFoundException('Enrollment not found')
    assertTransition(enrollment.status,EnrollmentStatus.DROPPED)
    if(enrollment.course.capacity !== null){
      await manager.findOne(Course,{
        where:{id:enrollment.course.id},
        select:{id:true},
        lock:{mode:"pessimistic_write"}
      })
    }


    enrollment.status = EnrollmentStatus.DROPPED
    await manager.save(enrollment)
    
    this.eventEmitter.emit('enrollment.dropped', {
        enrollmentId,
        studentId,
        courseId: enrollment.course.id,
      })

      if(enrollment.course.capacity !== null){
        await this.waitlistService.prompteNext(manager,enrollment.course.id,enrollment.course.requiresApproval)
      }

    return {message:'Successfully dropped from course'}
  })
}

async getMyEnrollments(studentId:string, pagination: offsetPaginationInput){
  const {page, limit, skip, take} = normalizeOffset(pagination)
  const [enrolments, totalItems] = await this.enrollmentRepo.findAndCount({
    where:{student:{id:studentId}},
    relations:['course'],
    select:{
      id:true,
      status: true,
      enrolledAt:true,
      course:{id:true,title:true}
    },
    order:{enrolledAt:'DESC'},
    skip,
    take,
  })
  const dtos = plainToInstance(EnrolledCourseDto,enrolments,{
    excludeExtraneousValues:true
  })
  return buildOffset(dtos,totalItems,page,limit)
}



private async reclaimPreviousEnrollments(manager, courseId:number, studentId:string){
  const existing = await manager.findOne(Enrollment,{
    where:{student:{id:studentId}, course:{id:courseId}},
    select:{id:true, status:true, rejectedAt:true}
  })
  if(!existing) return
  if(existing.status === EnrollmentStatus.REJECTED){
    const cooldownPassed = existing.rejectedAt && differenceInDays(new Date(), existing.rejectedAt) >= REJECTION_COOLDOWN_DAYS
    if(!cooldownPassed){
      const daysLeft = REJECTION_COOLDOWN_DAYS - differenceInDays(new Date(), existing.rejectedAt!)
      throw new BadRequestException(`You can reapply after ${daysLeft} days`)
    }
    await manager.delete(Enrollment,{id:existing.id})
  } else if(existing.status === EnrollmentStatus.CANCELLED){
    await manager.delete(Enrollment,{id: existing.id})
  } else{
    throw new BadRequestException(`Already have an enrollment with status:${existing.status}`)
  }
}


}
