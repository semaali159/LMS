import { Expose, Exclude,Transform } from "class-transformer";
import { EnrollmentStatus } from "src/common/enums/enrollmentStatus.enum";
import { InstructorBriefDto } from "src/courses/dtos/course-response.dto";

class CourseBriefDto {
  @Expose() id: number;
  @Expose() title: string;
}
export class EnrollCourseResponseDto {
  @Expose()
  id: number;

  @Expose()
  status: EnrollmentStatus

  @Expose()
  enrolledAt: Date;
  
  @Expose() 
  waitlistPosition: number | null;

  @Expose()
  @Transform(({ obj }) => obj.course.title)
  courseName: string;

  @Expose()
    @Transform(({ obj }) => ({ id: obj.course?.id, title: obj.course?.title }))
    course: CourseBriefDto;
}

export class EnrollmentWithStudentDto {
  @Expose() 
  id: number;
  @Expose() 
  status: EnrollmentStatus;
  @Expose() 
  enrolledAt: Date;
  @Expose() 
  waitlistPosition: number | null;

  @Expose()
  @Transform(({ obj }) => ({ id: obj.student?.id, username: obj.student?.username }))
  student: { id: string; username: string };
}

export class EnrolledCourseDto {
  @Expose() id: number;
  @Expose() status: EnrollmentStatus;
  @Expose() enrolledAt: Date;

  @Expose()
  @Transform(({ obj }) => ({ id: obj.course?.id, title: obj.course?.title }))
  course: CourseBriefDto;
}