import { Exclude, Expose, Transform, Type } from "class-transformer";
import { CourseState } from "src/common/enums/courseState.enum";

export class InstructorBriefDto {
  @Expose() id: string;
  @Expose() name: string;
}

export class CreateCourseResponseDto {
  @Expose() id: number;
  @Expose() title: string;
  @Expose() description: string;
  @Expose() sessionsCount: number;

  @Expose()
  @Type(() => InstructorBriefDto)
  instructor: InstructorBriefDto;
}

export class CourseListItemDto {
  @Expose() id: number;
  @Expose() title: string;
  @Expose() status: CourseState;
  @Expose() sessionsCount: number;

  @Expose()
  @Type(() => InstructorBriefDto)
  instructor: InstructorBriefDto;
}

export class CourseResponseDto extends CourseListItemDto {
  @Expose() description: string;
  @Expose() startDate: Date;
  @Expose() endDate: Date;

}

export class InstructorCourseListItemDto {
  @Expose() id: number;
  @Expose() title: string;
  @Expose() status: CourseState;
  @Expose() sessionsCount: number;
}

export class InstructorCourseResponseDto extends InstructorCourseListItemDto {
  @Expose() description: string;
  @Expose() startDate: Date;
  @Expose() endDate: Date;
}

export class CourseStatusChangeResponseDto {
  @Expose() id: number;
  @Expose() status: CourseState;
  @Expose() updatedAt: Date;
  @Expose() reason?: string;
}

export class EnrolledStudentDto {
  @Expose()
  @Transform(({ obj }) => obj.student?.id)
  id: string;

  @Expose()
  @Transform(({ obj }) => obj.student?.name)
  name: string;

  @Expose() status: 'ACTIVE' | 'PENDING' | 'DROPPED';
  @Expose() enrolledAt: Date;
}



export class CourseDetailResponseDto extends CourseResponseDto {
   @Expose() rejectionReason?: string;
}