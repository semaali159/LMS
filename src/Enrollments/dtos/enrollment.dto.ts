import { Expose, Exclude,Transform } from "class-transformer";
import { InstructorBriefDto } from "src/courses/dtos/course-response.dto";

export class EnrollCourseResponseDto {
  @Expose()
  id: number;

  @Expose()
  status: 'ACTIVE' | 'PENDING' | 'DROPPED';

  @Expose()
  enrolledAt: Date;

  @Expose()
  @Transform(({ obj }) => obj.course.title)
  courseName: string;

  @Expose()
  @Transform (({ obj }) => ({
  id: obj.course?.instructor?.id,
  name: obj.course?.instructor?.name,
}))
instructor: InstructorBriefDto;

  @Exclude()
  course: any;

  @Exclude()
  student: any;
}
