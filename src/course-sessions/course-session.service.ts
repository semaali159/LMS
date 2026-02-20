import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
// import { Course } from './entities/course.entity';
// import { User } from '../user/entities/user.entity';
// import { CourseSessionSchedule } from './entities/course-session-schedule.entity';
import { CourseSession } from './entities/course-session.entity';
import { Course } from 'src/courses/course.entity';
import { CreateCourseDto } from 'src/courses/dtos/course.dto';
import { User } from 'src/User/user.entity';
import { CourseSessionSchedule } from './entities/course-session-schedual';
import { getFirstDateOnOrAfter, addWeeks } from './utils/generateDays';
import { CreateSchedulesDto } from './dtos/create-session.dto';
// import { CreateCourseDto } from './dto/create-course.dto';
// import { CreateScheduleDto } from './dto/create-schedule.dto';
// import { getFirstDateOnOrAfter, addWeeks } from './utils/date.utils';

@Injectable()
export class CourseSessionsService {
  constructor(
    @InjectRepository(Course) private courseRepo: Repository<Course>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(CourseSessionSchedule) private scheduleRepo: Repository<CourseSessionSchedule>,
    @InjectRepository(CourseSession) private sessionRepo: Repository<CourseSession>,
    private dataSource: DataSource,
  ) {}

  async addSchedulesAndGenerateSessions(courseId: number, dto: CreateSchedulesDto) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    if (dto.day.length !== dto.startTime.length || dto.day.length !== dto.endTime.length) {
      throw new BadRequestException('Arrays length must match');
    }

    const totalSchedules = dto.day.length;
    const baseSessionsPerSchedule = Math.floor(course.sessionsCount / totalSchedules);
    let remainingSessions = course.sessionsCount % totalSchedules;

    return this.dataSource.transaction(async (manager) => {
      const schedules: CourseSessionSchedule[] = [];
      const sessions: CourseSession[] = [];
      let sessionCounter = 1;

      for (let i = 0; i < totalSchedules; i++) {
        const schedule = manager.create(CourseSessionSchedule, {
          course,
          day: dto.day[i],
          startTime: dto.startTime[i],
          endTime: dto.endTime[i],
        });
        schedules.push(schedule);
      }

      await manager.save(schedules);

      for (let i = 0; i < totalSchedules; i++) {
        let sessionsCountForThisSchedule = baseSessionsPerSchedule;
        if (remainingSessions > 0) {
          sessionsCountForThisSchedule += 1;
          remainingSessions -= 1;
        }

        const firstDate = getFirstDateOnOrAfter(new Date(course.startDate), dto.day[i]);

        for (let j = 0; j < sessionsCountForThisSchedule; j++) {
          const date = addWeeks(firstDate, j);
          const session = manager.create(CourseSession, {
            course,
            date,
            startTime: dto.startTime[i],
            endTime: dto.endTime[i],
            sessionNumber: sessionCounter++,
          });
          sessions.push(session);
        }
      }

      await manager.save(sessions);

      return { schedulesCreated: schedules.length, sessionsCreated: sessions.length };
    });
  }

  async getSessions(courseId: number) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    return this.sessionRepo.find({
      where: { course: { id: courseId } },
      // order: { sessionNumber: 'ASC' },
    });
  }
}
