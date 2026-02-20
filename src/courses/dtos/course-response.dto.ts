import { Exclude, Expose, plainToInstance, Transform, Type } from "class-transformer";
import { instructorResponeDto } from "src/User/dtos/response/teacher.dto";
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
export class createCourseResponseDto {
    @Expose()
  id: number;
  @Expose()
  title: string;
@Expose()
  description: string;
@Expose()
  sessionsCount: number;
@Expose()
  startDate: Date;
  @Expose()
  instructorId:string
}

export class EnrollCourseResponseDto {
  @Expose()
  id: number;

  @Expose()
  status: 'ACTIVE' | 'PENDING' | 'DROPPED';

  @Expose()
  enrolledAt: Date;

  @Expose()
  @Transform(({ obj }) => obj.course.title)
  courseName: string;

  @Expose()
  @Transform(({ obj }) =>
    ({
      id: obj.course.teacher.id,
      username: obj.course.instructor.username,
    })
  )
  instructor: instructorResponeDto;

  @Exclude()
  course: any;

  @Exclude()
  student: any;
}