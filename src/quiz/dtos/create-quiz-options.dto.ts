import { IsBoolean, IsString } from "class-validator";

export class CreateOptionsDto{
    @IsString()
    text: string

    @IsBoolean()
    isCorrect: boolean
}