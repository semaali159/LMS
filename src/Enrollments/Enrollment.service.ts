import { Injectable, ForbiddenException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Enrollment } from "./Enrollment.entity";

@Injectable()
export class EnrollmentService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
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
}
