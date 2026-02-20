import { Type } from "class-transformer";
import { IsDate, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateCourseDto {
    @IsNotEmpty()
      @IsString()
  title: string;
    @IsNotEmpty()
      @IsString()
  description?: string;
  @IsNumber()
  @IsNotEmpty()
    sessionsCount: number;
        @Type(() => Date)
    @IsDate()
  @IsNotEmpty()
  startDate: Date;
}

export class UpdateCourseDto {
    @IsOptional()
         @IsString() 
  title?: string;
      @IsOptional()
         @IsString() 
  description?: string;
   @IsNumber()
  @IsNotEmpty()
    sessionsCount: number;
    @Type(() => Date)
    @IsDate()
  @IsNotEmpty()
  startDate: Date;
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  endDate: Date;

}
