import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { Course } from "./course.entity";
import { CreateCourseDto, RejectCourseDto, UpdateCourseDto, UpdateCourseSessionDto } from "./dtos/course.dto";
import { User } from "src/User/user.entity";
import { plainToInstance } from "class-transformer";
import { CourseDetailResponseDto,
   CourseListItemDto,
   CourseResponseDto,
   CourseStatusChangeResponseDto, 
   CreateCourseResponseDto, 
   InstructorCourseListItemDto,
    InstructorCourseResponseDto } from "./dtos/course-response.dto";
import { CourseState } from "src/common/enums/courseState.enum";
import { Role } from "src/common/enums/roles.enum";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Enrollment } from "src/Enrollments/Enrollment.entity";
import { NotificationService } from "src/Notification/Notification.service";
import { CourseSession } from "src/course-sessions/entities/course-session.entity";
import { JwtPayload } from "src/common/types/payload.interface";
import { CourseSessionSchedule } from "src/course-sessions/entities/course-session-schedual";

 interface validateForSubmit{
      title: string;
      description: string;
      sessionsCount: number;
      status:CourseState;
    } 
@Injectable()
export class CourseService{
    constructor(
      private eventEmitter: EventEmitter2,
    @InjectRepository(Course)private readonly CourseRepository:Repository<Course>,
    @InjectRepository(User) private readonly UserRepository: Repository<User>,
    @InjectRepository(CourseSession) private readonly sessionRepository: Repository<CourseSession>, 
    @InjectRepository (Enrollment) private readonly enrollmentRepository: Repository<Enrollment>,
    private readonly notificationService: NotificationService,
    private dataSource: DataSource,
    )
    {}

    
  async create(dto:CreateCourseDto,instructorId:string){
      const instructor = await this.UserRepository.findOne({ where: { id: instructorId } });

    if (!instructor ||
       instructor.role !== Role.INSTRUCTOR 
      ) {
      throw new ForbiddenException('Only instructors can create courses');
    }

    const course = this.CourseRepository.create({
      ...dto,
      instructor,
  status: CourseState.DRAFT,
    });

    const savedCourse = await this.CourseRepository.save(course);
    return plainToInstance(CreateCourseResponseDto, savedCourse, {
    excludeExtraneousValues: true,  
  });
}
  async update(id:number,dto: UpdateCourseDto, instructorId:string,){
       const course = await this.CourseRepository.findOne({
      where: { id },
      relations: ['instructor'],
      select: {
        id: true,
        title: true,
        description: true,
        instructor: { id: true },
      },
    });

    if (!course) throw new NotFoundException('Course not found');
    if (course.instructor.id !== instructorId)
      throw new ForbiddenException('You are not the owner of this course');

    course.title =
    dto.title ?? course.title;

    course.description =
    dto.description ?? course.description;
    const save = await this.CourseRepository.save(course)
    return plainToInstance(CreateCourseResponseDto, save, {
    excludeExtraneousValues: true,  
    }); ;
  }
  async deleteCourse(id: number, instructorId: string) {
    const course = await this.CourseRepository.findOne({
      where: { id },
      relations: ['instructor'],
      select: {
        id: true,
        instructor: { id: true },
      },
    });

    if (!course) throw new NotFoundException('Course not found');
    if (course.instructor.id !== instructorId)
      throw new ForbiddenException('You are not the owner of this course');

    await this.notificationService.deleteAllForCourse(id);
    await this.CourseRepository.remove(course);
    return {id, message:"Course deleted successfully"}
  }

  async replaceSchedual(courseId:number, dto: UpdateCourseSessionDto, instructorId:string){
    return this.dataSource.transaction(async (manager)=>{
      const course = await manager.findOne(Course,{
        where:{id:courseId},
        relations: ['instructor'],
        lock:{mode: 'pessimistic_write'},
      })
      if(!course) throw new NotFoundException('Course not found')
      if(course.instructor.id !== instructorId) throw new ForbiddenException()
      if(![CourseState.DRAFT, CourseState.PENDING_REVIEW].includes(course.status)){
        throw new BadRequestException('Schedule cannot be edited')
      }
      
      await manager.delete(CourseSession, {course:{id:courseId}})
      await manager.delete(CourseSessionSchedule,{course:{id:courseId}})
      if(course.status === CourseState.PENDING_REVIEW ){
        course.status = CourseState.DRAFT
      }
      await manager.save(course)
    })

  }


  
  // for students
  async getAll() {
    const courses = await this.CourseRepository.find({
      where: {
        status: CourseState.PUBLISHED
    },
      relations: ['instructor'],
      select: {
        id: true,
        title: true,
        status: true,
        sessionsCount: true,
        instructor: { id: true, username: true }}
    });
    return plainToInstance(CourseListItemDto,courses, {
    excludeExtraneousValues: true,  
  })
  }

  async getOne(id: number) {
    const course = await this.CourseRepository.findOne({
      where: { id , status:CourseState.PUBLISHED},
      relations: ['instructor'],
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        sessionsCount: true,
        instructor: { id: true, username: true },
      },
    });
    if (!course) {
    throw new NotFoundException('Course not found');
    }
    return plainToInstance(CourseResponseDto, course, {
    excludeExtraneousValues: true,  
  })
  }

  
  async getAllCoursesForInstructor(instructorId:string, status?:CourseState){
    const courses = await this.CourseRepository.find({
      where: {instructor:{id:instructorId}, ...(status && {status})
    },
    select: {
        id: true,
        title: true,
        status: true,
        sessionsCount: true,
      },
    });
    return plainToInstance(InstructorCourseListItemDto, courses, {
    excludeExtraneousValues: true,  
  })
  }


   async getOneCourseForInstructor(courseId:number,instructorId:string){
    const course = await this.CourseRepository.findOne({
      where: {instructor:{id:instructorId},id:courseId
    },
    select: {
        id: true,
        title: true,
        description: true,
        status: true,
        sessionsCount: true,
      },
    });
    if (!course) throw new NotFoundException('Course not found');

    return plainToInstance(InstructorCourseResponseDto, course, {
    excludeExtraneousValues: true,  
  })
  }

  //  for admin
  async getOneDetailed(id: number, user:JwtPayload) {
    const course = await this.CourseRepository.findOne({
      where: { id },
      relations: ['instructor'],
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        sessionsCount: true,
        instructor: { id: true, username: true },
      },
    });
    if (!course) {
    throw new NotFoundException('Course not found');
    }

    const isOwner = course.instructor.id === user.userId
    const isAdmin = user.roles?.includes(Role.ADMIN)
    if(!isAdmin && !isOwner) throw new ForbiddenException()
    const enrollments = await this.enrollmentRepository.find({
       where:{course:{id: id}, status:'ACTIVE'},
       relations:['student'],
       select: {
        id: true,
        status: true,
        enrolledAt: true,
        student: { id: true, username: true },
      },
  })  
    return  plainToInstance(
        CourseDetailResponseDto,
        { ...course, enrollments },
        { excludeExtraneousValues: true },
      )
  }

  async submitForReview(courseId:number,instructorId:string){
    const course = await this.getCourseOrFail(courseId)
    if(course.instructor.id !== instructorId){
      throw new ForbiddenException("Not allowed")
    }
    this.assertTransition(course.status,CourseState.PENDING_REVIEW)
    const courseval  : validateForSubmit   = {
      title:course.title,
      description:course.description,
      status: course.status,
      sessionsCount:course.sessionsCount
    }
    this.validateCourseReadyForReview(courseval)
    course.status = CourseState.PENDING_REVIEW
    //TO_DO
    //notify admin that a course added to be reviewed 
    const save = await this.CourseRepository.save(course)
    return this.toStatusChangeResponse(save)
  }

  
async approvePublishCourse(courseId: number) {
  return this.dataSource.transaction(async (manager) => {
    
    const course = await manager.findOne(Course, {
      where: { id: courseId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!course) throw new NotFoundException('Course not found');

    this.assertTransition(course.status, CourseState.PUBLISHED);

    const sessionsCount = await manager.count(CourseSession, {
      where: { course: { id: courseId } },
    });

    if (sessionsCount !== course.sessionsCount) {
      throw new BadRequestException('Generate all sessions before publishing');
    }

    course.status = CourseState.PUBLISHED;
    const savedCourse = await manager.save(course);
    return this.toStatusChangeResponse(savedCourse);
  });
}


  async rejectPublishCourse(courseId:number, reason:string){
    const course = await this.getCourseOrFail(courseId)
    this.assertTransition(
    course.status,
    CourseState.DRAFT);
    course.status = CourseState.DRAFT;
    course.rejectionReason = reason
    const save = await this.CourseRepository.save(course)
    return this.toStatusChangeResponse(save,reason)
  }  

  async archivedCourse(courseId:number,user: JwtPayload,){
    const course = await this.getCourseOrFail(courseId)
    if (
     user.roles?.includes(Role.INSTRUCTOR) &&
     course.instructor.id !== user.userId
    ) {throw new ForbiddenException();}
    
  
    this.assertTransition(course.status,CourseState.ARCHIVED)
    course.status = CourseState.ARCHIVED;
    const save = await this.CourseRepository.save(course)
    return this.toStatusChangeResponse(save) 
  }

  private async getCourseOrFail(courseId: number):Promise<Course> {
   const course = await this.CourseRepository.findOne({where:{id:courseId},
    relations:['instructor'],
     select: {
        id: true,
        title: true,
        description: true,
        sessionsCount: true,
        startDate: true,
        endDate: true,
        status: true,
        instructor: { id: true }}
  })
    if(!course){
      throw new NotFoundException('course not found')
    }
   return course;
  }

  private validateCourseReadyForReview(course:validateForSubmit){
     if (!course.title) {
      throw new BadRequestException('Title is required');
    }

    if (!course.description) {
      throw new BadRequestException('Description is required');
    }

    if (course.sessionsCount === 0) {
      throw new BadRequestException('Course must contain sessions');
    }
   
  }

  private readonly transitions : Record<CourseState, CourseState[]>  = {
    [CourseState.DRAFT]:
    [CourseState.PENDING_REVIEW],

    [CourseState.PENDING_REVIEW]:
    [CourseState.PUBLISHED,
     CourseState.DRAFT],

    [CourseState.PUBLISHED]:
    [CourseState.ARCHIVED],

    [CourseState.ARCHIVED]:[]
  }
  private assertTransition(current:CourseState,target:CourseState): void{
    const allowed = this.transitions[current] ?? [];
    if(!allowed.includes(target)){
      throw new BadRequestException(
      `Invalid transition from ${current} to ${target}`,)
    }
  }

  private toStatusChangeResponse(course: Course, reason?: string) {
  return plainToInstance(
    CourseStatusChangeResponseDto,
    { ...course, reason },
    { excludeExtraneousValues: true },
  );
}

}