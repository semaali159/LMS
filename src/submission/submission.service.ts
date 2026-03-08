import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Submission } from './submission.entity';
import { Assignment } from '../assignment/assignment.entity';
import { User } from 'src/User/user.entity';
// import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { GradeSubmissionDto } from './dtos/gradeSubmission.dto';
import { Enrollment } from 'src/Enrollments/Enrollment.entity';
import { EnrollmentService } from 'src/Enrollments/Enrollment.service';
import { StorageService } from 'src/common/services/upload/upload.service';

@Injectable()
export class SubmissionService {

  constructor(
    
  private enrollmentService: EnrollmentService,
    @InjectRepository(Submission)
    private submissionRepo: Repository<Submission>,
    @InjectRepository(Assignment)
    private assignmentRepo: Repository<Assignment>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private storageService: StorageService) {}


  async submit(
    assignmentId: number,
    file: Express.Multer.File,
    studentId: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const assignment = await this.assignmentRepo.findOne({
      where: { id: assignmentId },
      relations: ['course'],
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }
    const isEnroll = await this.enrollmentService.getActiveEnrollmentOrFail(
     studentId,
    assignment.course.id,
     );

if(!isEnroll){
  throw new BadRequestException('Not enrolled in this course')
}

    const existing = await this.submissionRepo.findOne({
      where: {
        assignment: { id: assignmentId },
        student: { id: studentId },
      },
    });

    if (existing) {
      throw new BadRequestException('You already submitted');
    }
    const upload = await this.storageService.uploadFile(file);

    const student = await this.userRepo.findOne({
      where: { id: studentId },
    });
if(!student){
    throw new BadRequestException("user not found")
}
    const submission = this.submissionRepo.create({
      assignment,
      student,
      fileUrl: upload
      // filePublicId: upload.public_id,
    });

    return this.submissionRepo.save(submission);
  }


  async grade(
    submissionId: number,
    dto: GradeSubmissionDto,
    instructorId: string,
  ) {
    const submission = await this.submissionRepo.findOne({
      where: { id: submissionId },
      relations: ['assignment', 'assignment.course', 'assignment.course.teacher'],
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    if (submission.assignment.course.instructor.id !== instructorId) {
      throw new ForbiddenException('Not course owner');
    }

    submission.grade = dto.grade;
    submission.feedback = dto.feedback;

    return this.submissionRepo.save(submission);
  }
  async getMySubmission(assignmentId: number, studentId: string) {
  return this.submissionRepo.findOne({
    where: {
      assignment: { id: assignmentId },
      student: { id: studentId },
    },
  });
}

async getAssignmentSubmissions(
  assignmentId: number,
  instructorId: string,
) {
  const assignment = await this.assignmentRepo.findOne({
    where: { id: assignmentId },
    relations: ['course', 'course.teacher'],
  });

  if (!assignment) throw new NotFoundException('Assignment not found');
  if (assignment.course.instructor.id !== instructorId)
    throw new ForbiddenException('Not course owner');

  return this.submissionRepo.find({
    where: { assignment: { id: assignmentId } },
    relations: ['student'],
  });
}

}
