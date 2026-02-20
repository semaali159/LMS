import { IsArray, ArrayNotEmpty, IsEnum, IsString, ValidateIf } from 'class-validator';
import { WeekDay } from '../../common/enums/week-day.enum';
export class CreateSchedulesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(WeekDay, { each: true })
  day: WeekDay[];

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  startTime: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  endTime: string[];

  @ValidateIf((o) => o.day.length !== o.startTime.length || o.day.length !== o.endTime.length)
  validateLengths() {
    throw new Error('Arrays length must match');
  }
}
