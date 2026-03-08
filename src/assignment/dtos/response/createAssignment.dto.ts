
import { Expose, Transform, Type } from 'class-transformer';
import { SubmissionType } from '../../../common/enums/submission-type';
// import { teacherResponeDto } from 'src/User/dtos/response/teacher.dto';

export class CreateAssignmentResponseDto {
    @Expose()
  title: string;
    @Expose()
  description?: string;
    @Expose()
  dueDate?: string;
    @Expose()
  submissionType: SubmissionType;
//  @Expose()
//   @Type(() => teacherResponeDto)
// //   @Transform(({ obj }) => obj.course?.teacher)
//   teacher:teacherResponeDto}
}