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

const REJECTION_COOLDOWN_DAYS = 30

@Injectable()
export class EnrollmentService {
  private readonly transitions: Record<EnrollmentStatus,EnrollmentStatus[]> ={
    [EnrollmentStatus.PENDING]:[
      EnrollmentStatus.ACTIVE,
      EnrollmentStatus.REJECTED,
      EnrollmentStatus.CANCELLED
    ],
    [EnrollmentStatus.WAITLISTED]:[
      EnrollmentStatus.PENDING,
      EnrollmentStatus.CANCELLED
    ],
    [EnrollmentStatus.ACTIVE]:[
      EnrollmentStatus.DROPPED,
      EnrollmentStatus.COMPLETED,
    ],
    [EnrollmentStatus.REJECTED]:[],
    [EnrollmentStatus.CANCELLED]:[],
    [EnrollmentStatus.DROPPED]:[],
    [EnrollmentStatus.COMPLETED]:[],
  }
  constructor(
    
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
      const existing = await manager.findOne(Enrollment,{
        where:{student:{id:studentId}, course:{id:courseId}},
        select:{id:true, status:true, rejectedAt:true}
      })
      if(existing){
        if(existing.status === EnrollmentStatus.REJECTED){
          const cooldownPassed = existing.rejectedAt &&
          differenceInDays(new Date(), existing.rejectedAt)>= REJECTION_COOLDOWN_DAYS
          if(!cooldownPassed){
            const daysLeft = REJECTION_COOLDOWN_DAYS - 
            differenceInDays(new Date(), existing.rejectedAt!)
            throw new BadRequestException(`You can reapply after ${daysLeft} days`)
          }
          await manager.delete(Enrollment,{id:existing.id})
        }else if(existing.status === EnrollmentStatus.CANCELLED){
          await manager.delete(Enrollment,{id:existing.id})

        }else{
          throw new BadRequestException(`Already have an enrollment with status: ${existing.status}`)
        }
      }
      let status: EnrollmentStatus
      let waitlistPosition:number | null = null

      if(course.capacity!==null){
        const active = await manager.count(Enrollment,{
          where:{course:{id:courseId},status:EnrollmentStatus.ACTIVE}
        })
        if(active>= course.capacity){
          const lastWaitlisted = await manager.findOne(Enrollment,{
            where:{course:{id:courseId}, status:EnrollmentStatus.WAITLISTED},
            order:{waitlistPosition:'DESC'},
            select:{waitlistPosition:true}
          })
          status = EnrollmentStatus.WAITLISTED
          waitlistPosition = (lastWaitlisted?.waitlistPosition?? 0) + 1
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
    this.assertTransition(enrollment.status, EnrollmentStatus.CANCELLED)
    const wasWaitlisted = enrollment.status=== EnrollmentStatus.WAITLISTED
    const cancelledPosition = enrollment.waitlistPosition

    enrollment.status = EnrollmentStatus.CANCELLED
    enrollment.waitlistPosition = null
    await manager.save(enrollment)
    if(wasWaitlisted && cancelledPosition!== null){
      await manager
        .createQueryBuilder()
        .update(Enrollment)
        .set({waitlistPosition:()=>'waitlist_position - 1'})
        .andWhere('course_id = :courseId',{courseId: enrollment.course.id})
        .andWhere('status = :status',{status:EnrollmentStatus.WAITLISTED})
        .andWhere('waitlist_position > :position',{position: cancelledPosition})
        .execute()
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
    this.assertTransition(enrollment.status,EnrollmentStatus.DROPPED)
    enrollment.status = EnrollmentStatus.DROPPED
    await manager.save(enrollment)
    
    this.eventEmitter.emit('enrollment.dropped', {
        enrollmentId,
        studentId,
        courseId: enrollment.course.id,
      })

    if(enrollment.course.capacity !== null){
      const firstWaitlisted = await manager.findOne(Enrollment,{
        where:{
          course:{id:enrollment.course.id},
          status: EnrollmentStatus.WAITLISTED
        },
        order:{waitlistPosition:'ASC'},
        select:{id:true,waitlistPosition:true}
      })
      if(firstWaitlisted){
        const newStatus = enrollment.course.requiresApproval ? EnrollmentStatus.PENDING : EnrollmentStatus.ACTIVE
        await manager.update(Enrollment,{id:firstWaitlisted.id},{
          status:newStatus,
          waitlistPosition:null
        })
        await manager
          .createQueryBuilder()
          .update(Enrollment)
          .set({
            waitlistPosition:()=>'waitlist_position - 1'
          })
          .where('course_id = :courseId', {courseId:enrollment.course.id})
          .andWhere('status = :status',{status: EnrollmentStatus.WAITLISTED})
          .andWhere('waitlist_position > :position',{
            position:firstWaitlisted.waitlistPosition
          })
          .execute()
      
        this.eventEmitter.emit(      
            newStatus === EnrollmentStatus.ACTIVE
              ? 'enrollment.activated_from_waitlist'
              : 'enrollment.promoted_from_waitlist', {
            enrollmentId: firstWaitlisted.id,
            courseId: enrollment.course.id,
          });
      }
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

// for instructor

async getPendingEnrollment(courseId: number, instructorId:string,pagination:offsetPaginationInput){
  const course = await this.CourseRepository.findOne({
    where:{id:courseId, instructor:{id:instructorId}},
    select:{id:true}
  })
  if(!course) throw new ForbiddenException('Not allowed')
  const {page, limit,skip,take} = normalizeOffset(pagination)
  const [enrollments,totalItems] = await this.enrollmentRepo.findAndCount({
    where:{course:{id:courseId}, status:EnrollmentStatus.PENDING},
    relations:['student'],
    select:{
      id:true,
        status: true,
        enrolledAt: true,
        waitlistPosition: true,
        student: { id: true, username: true },
      },
      order:{enrolledAt:'ASC'},
      skip,
      take
  })
  const dtos = plainToInstance(EnrollmentWithStudentDto, enrollments, {
        excludeExtraneousValues: true,
      });
  
      return buildOffset(dtos, totalItems, page, limit);
}

async acceptEnrollment(enrollmentId: number, instructorId: string) {
  return this.dataSource.transaction(async (manager) => {
    const enrollment = await manager.findOne(Enrollment, {
      where: { id: enrollmentId },
      relations: ['course', 'course.instructor'],
      select: {
        id: true,
        status: true,
        course: { id: true, capacity: true, instructor: { id: true } },
      },
      lock: { mode: 'pessimistic_write' },
    });

    if (!enrollment) throw new NotFoundException('Enrollment not found');
    if (enrollment.course.instructor.id !== instructorId) {
      throw new ForbiddenException('Only the course owner can manage enrollments');
    }

    this.assertTransition(enrollment.status, EnrollmentStatus.ACTIVE);

    
    if (enrollment.course.capacity !== null) {
      const activeCount = await manager.count(Enrollment, {
        where: { course: { id: enrollment.course.id }, status: EnrollmentStatus.ACTIVE },
      });

      if (activeCount >= enrollment.course.capacity) {
        throw new BadRequestException(
          'Cannot accept: course is at full capacity. A student must drop first.',
        );
      }
    }

    enrollment.status = EnrollmentStatus.ACTIVE;
    enrollment.waitlistPosition = null;
    const saved = await manager.save(enrollment);

    this.eventEmitter.emit('enrollment.accepted', {
      enrollmentId,
      courseId: enrollment.course.id,
    });

    return plainToInstance(EnrollmentWithStudentDto, saved, {
      excludeExtraneousValues: true,
    });
  });
}
async rejectEnrollment(enrollmentId: number,instructorId:string){
  const enrollment = await this.enrollmentRepo.findOne({
    where:{id:enrollmentId},
    relations:['course','course.instructor'],
    select:{
      id:true,
      status:true,
      course:{id:true,instructor:{id:true}}
    }
  })
  if(!enrollment) throw new NotFoundException('Enrollment not found')
  if(enrollment.course.instructor.id !== instructorId) {
    throw new ForbiddenException('Only the course owner can manage enrollments')
  }
  this.assertTransition(enrollment.status,EnrollmentStatus.REJECTED)
  enrollment.status = EnrollmentStatus.REJECTED;
      enrollment.rejectedAt = new Date();
      const saved = await this.enrollmentRepo.save(enrollment);
  
      this.eventEmitter.emit('enrollment.rejected', {
        enrollmentId,
        courseId: enrollment.course.id,
      });
  
      return plainToInstance(EnrollmentWithStudentDto, saved, {
        excludeExtraneousValues: true,
      });
}

async getWaitlistedEnrollments(courseId: number,instructorId:string,pagination:offsetPaginationInput){
  const course = await this.CourseRepository.findOne({
    where:{id:courseId, instructor:{id:instructorId}},
    select:{id:true}
  })
  if(!course) throw new ForbiddenException('Not allowed')
  const {page, limit, skip, take} = normalizeOffset(pagination)
  
  const [enrollments, totalItems] = await this.enrollmentRepo.findAndCount({
    where:{course:{id:courseId}, status:EnrollmentStatus.WAITLISTED},
    relations:['student'],
    select:{
        id: true,
        status: true,
        enrolledAt: true,
        waitlistPosition: true,
        student: { id: true, username: true },
    },
    order:{waitlistPosition:'ASC'},
    skip,
    take,
  })
  const dtos = plainToInstance(EnrollmentWithStudentDto, enrollments, {
        excludeExtraneousValues: true,
      });
  
      return buildOffset(dtos, totalItems, page, limit);
}

private assertTransition(current: EnrollmentStatus, target: EnrollmentStatus):void{
  const allowed = this.transitions[current] ?? []
  if(!allowed.includes(target)){
    throw new BadRequestException(
      `Invalid enrollment transition from ${current} to ${target}`
    )
  }
}

}
