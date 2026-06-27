import { Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";
import { WeekDay } from "src/common/enums/week-day.enum";

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
}

export class UpdateCourseSessionDto{
    @IsNumber()
    @Min(1)
    sessionsCount: number;
    @Type(() => Date)
    @IsDate()
    startDate: Date;
    @Type(() => Date)
    @IsDate()
    endDate: Date;

    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({each:true})
    @Type(()=> ScheduleItemDto)
    Schedules: ScheduleItemDto[]

}

export class ScheduleItemDto{
  @IsEnum(WeekDay)
  day: WeekDay;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string
}




export class RejectCourseDto {
  @IsString()
  reason: string;
}