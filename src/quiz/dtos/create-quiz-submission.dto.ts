import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAnswerDto } from './create-quiz-answer.dto';

export class SubmitQuizDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAnswerDto)
  answers: CreateAnswerDto[];
}