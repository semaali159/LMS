import { IsInt, IsOptional, IsString, Min, Max } from 'class-validator';

export class GradeSubmissionDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  grade?: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}
