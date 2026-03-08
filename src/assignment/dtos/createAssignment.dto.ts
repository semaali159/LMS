import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { SubmissionType } from '../../common/enums/submission-type';

export class CreateAssignmentDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsNotEmpty()
  @IsEnum(SubmissionType)
  submissionType: SubmissionType;
}
