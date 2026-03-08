import { IsArray, IsBoolean, IsDateString, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";
import { CreateQuestionDto } from "./create-quiz-question.dto";
import { Type } from "class-transformer";

export class CreateQuizDto{
    @IsString()
    title:string

    @IsString()
    @IsOptional()
    desription: string

    @IsDateString()
    startTime:string

    @IsDateString()
    endTime:string

    @IsInt()
    @IsOptional()
    @Min(1)
    durationMinutes?: number

    @IsOptional()
    @IsBoolean()
    showResultsImmediately?: boolean

    @IsInt()
    sessionId: number

    @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
    questions: CreateQuestionDto[]
}