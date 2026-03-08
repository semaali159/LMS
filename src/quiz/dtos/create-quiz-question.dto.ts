import { IsArray, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";
import { QuestionType } from "src/common/enums/questionType.enum";
import { CreateOptionsDto } from "./create-quiz-options.dto";
import { Type } from "class-transformer";

export class CreateQuestionDto{

    @IsString()
    questionText: string

    @IsEnum(QuestionType)
    questionType: QuestionType

    @IsNumber()
    @Min(1)
    points:number

    @IsOptional()
  @IsString()
  correctAnswer?: string;

  @IsOptional()
  @IsInt()
  correctOptionId?:number

  @IsOptional()
  @IsArray()
  @ValidateNested({each: true})
  @Type(()=> CreateOptionsDto)
  options:CreateOptionsDto[]
}