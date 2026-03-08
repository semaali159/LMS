import { IsBoolean, IsInt, IsOptional, IsString } from "class-validator";

export class CreateAnswerDto{
    @IsInt()
    questionId: number

    @IsOptional()
    @IsString()
    answerTexr: string

    @IsOptional()
    @IsInt()
    selectedOptionId?: number

    @IsBoolean()
    @IsOptional()
    isCorrect?:boolean;
}