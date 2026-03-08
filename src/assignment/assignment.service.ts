import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Assignment } from './assignment.entity';
import { Course } from 'src/courses/course.entity';
import { CreateAssignmentDto } from './dtos/createAssignment.dto';
// import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { SubmissionType } from '../common/enums/submission-type';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { plainToInstance } from 'class-transformer';
import { createCipheriv } from 'crypto';
import { CreateAssignmentResponseDto } from './dtos/response/createAssignment.dto';
import { StorageService } from 'src/common/services/upload/upload.service';

@Injectable()
export class AssignmentService {
  constructor(
       private eventEmitter: EventEmitter2,
    @InjectRepository(Assignment)
    private assignmentRepo: Repository<Assignment>,

    @InjectRepository(Course)
    private courseRepo: Repository<Course>,

    // private cloudinaryService: CloudinaryService,
    private storageService:StorageService,
    private dataSource: DataSource,
 
  ) {}

  async create(
    courseId: number,
    dto: CreateAssignmentDto,
    instructorId: string,
    file?: Express.Multer.File,
  ) {
      const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  let uploadedFileKey: string | undefined;
  try{
    const course = await queryRunner.manager.findOne(Course,{
      where:{id:courseId} , relations:['instructor']
    })
    if(!course){
      throw  new NotFoundException('course not found')
    }
     if (course.instructor.id !== instructorId) throw new ForbiddenException('Not your course');

    let fileUrl: string | undefined;
    if(dto.submissionType === SubmissionType.FILE){
      if(!file) throw new BadRequestException('file is required')
          const uploadResult = await this.storageService.uploadFile(file)
  fileUrl = uploadResult
  uploadedFileKey = fileUrl.split('/').pop()
    }
    const assignment = queryRunner.manager.create(Assignment,{
      ...dto,fileUrl,course
    })
    const savedAssignment = await queryRunner.manager.save(assignment)
    await queryRunner.commitTransaction()
    // this.eventEmitter.emit('assignment.created',{ ... })
    return  plainToInstance(CreateAssignmentResponseDto,
      {
        title: savedAssignment.title,
        description: savedAssignment.description,
        dueDate: savedAssignment.dueDate,
        submissionType: savedAssignment.submissionType,
        teacher: {
          id: course.instructor.id,
          username: course.instructor.username,
        },
      },{excludeExtraneousValues: true}) ;
}catch(error){
  await queryRunner.rollbackTransaction()
  if(uploadedFileKey){
    await this.storageService.deleteFile(uploadedFileKey)
  }
  throw error

  }finally{
    await queryRunner.release
  }}
    async getCourseAssignments(courseId: number) {
    return this.assignmentRepo.find({
      where: { course: { id: courseId } },
      order: { createdAt: 'DESC' },
    });
  }
}
