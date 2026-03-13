import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Course } from "./course.entity";
import { CreateCourseDto, UpdateCourseDto } from "./dtos/course.dto";
import { User } from "src/User/user.entity";
import { plainToInstance } from "class-transformer";
import { createCourseResponseDto, EnrollCourseResponseDto } from "./dtos/course-response.dto";
import { CourseState } from "src/common/enums/courseState.enum";
import { Role } from "src/common/enums/roles.enum";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Enrollment } from "src/Enrollments/Enrollment.entity";

@Injectable()
export class CourseService{
    constructor(
      private eventEmitter: EventEmitter2,
    @InjectRepository(Course)private readonly CourseRepository:Repository<Course>,
    @InjectRepository(User) private readonly UserRepository: Repository<User>,
    @InjectRepository (Enrollment) private readonly enrollmentRepository: Repository<Enrollment>
    )
    {}
async create(dto:CreateCourseDto,instructorId:string){
const instructor = await this.UserRepository.findOne({ where: { id: instructorId } });

    if (!instructor || instructor.role !== Role.INSTRUCTOR) {
      throw new ForbiddenException('Only instructors can create courses');
    }

    const course = this.CourseRepository.create({
      ...dto,
      instructor,
    });

    const savedCourse = await this.CourseRepository.save(course);
    return plainToInstance(createCourseResponseDto, savedCourse, {
    excludeExtraneousValues: true,  
  });
}
async update(id:number,dto: UpdateCourseDto, instructorId:string,){
       const course = await this.CourseRepository.findOne({
      where: { id },
      relations: ['instructor'],
    });

    if (!course) throw new NotFoundException('Course not found');
    if (course.instructor.id !== instructorId)
      throw new ForbiddenException('You are not the owner of this course');

    Object.assign(course, dto);
    return await this.CourseRepository.save(course);
}
  async deleteCourse(id: number, instructorId: string) {
    const course = await this.CourseRepository.findOne({
      where: { id },
      relations: ['instructor'],
    });

    if (!course) throw new NotFoundException('Course not found');
    if (course.instructor.id !== instructorId)
      throw new ForbiddenException('You are not the owner of this course');

    return this.CourseRepository.remove(course);
  }

  async getAll() {
    return this.CourseRepository.find({
      relations: ['instructor'],
    });
  }

  async getOne(id: number) {
    return this.CourseRepository.findOne({
      where: { id },
      relations: ['instructor',
         'enrollments','enrollments.student'
      ],
    });
  }

async updateCourseState(instructorId:string, courseId: number, newStatus:CourseState){
const course = await this.CourseRepository.findOne({where:{id:courseId}, relations:['sessions',
  //  'enrollments'
  ]}) 
if(!course){
  throw new NotFoundException('course not found')
}
if(course.instructor.id !== instructorId){
  throw new ForbiddenException()
}
if(course.status == CourseState.AECHIVED){
  throw new BadRequestException('Archived course')
}
if(newStatus === CourseState.PUBLISHED ||
   newStatus === CourseState.AECHIVED &&
    course.status.length>0){
throw new BadRequestException('student already enrolled')
}
course.status = newStatus;
const save = await this.CourseRepository.save(course)
return plainToInstance(createCourseResponseDto,save,{excludeExtraneousValues: true })
}
}