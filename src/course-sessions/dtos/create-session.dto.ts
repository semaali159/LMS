import { IsArray, ArrayNotEmpty, IsEnum, IsString, ValidateIf, ValidateNested, IsDate, IsOptional, Matches, IsDateString } from 'class-validator';
import { WeekDay } from '../../common/enums/week-day.enum';
import { Type } from 'class-transformer';


const TIME_24H_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/
export class ScheduleItemDto {
  @IsEnum(WeekDay)
  day: WeekDay;

  @IsString()
  @Matches(TIME_24H_REGEX, {
    message: 'startTime must be in 24-hour HH:mm format (e.g. "14:00")',
  })
  startTime: string;

  @IsString()
  @Matches(TIME_24H_REGEX, {
    message: 'endTime must be in 24-hour HH:mm format (e.g. "14:00")',
  })
  endTime: string;

}

export class CreateScheduleDto{
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({each:true})
  @Type(()=> ScheduleItemDto)
  schedules:ScheduleItemDto[]
}

export class UpdateSessionDto{
   @IsOptional()
   @IsDateString() 
   date?: string;
 
   @IsOptional() 
   @IsString()
   @Matches(TIME_24H_REGEX, { message: 'startTime must be in 24-hour HH:mm format' })
   startTime?: string;
 
   @IsOptional() 
   @IsString()
   @Matches(TIME_24H_REGEX, { message: 'endTime must be in 24-hour HH:mm format' })
   endTime?: string;
 }