import { Expose } from 'class-transformer';

export class SessionResponseDto {
  @Expose() id: number;
  @Expose() date: Date;
  @Expose() startTime?: string;
  @Expose() endTime: string;
  @Expose() sessionNumber: number;
}