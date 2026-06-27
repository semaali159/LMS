import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { CourseSession } from './entities/course-session.entity';
import { Course } from 'src/courses/course.entity';
import { CreateCourseDto } from 'src/courses/dtos/course.dto';
import { User } from 'src/User/user.entity';
import { CourseSessionSchedule } from './entities/course-session-schedual';
import { getFirstDateOnOrAfter, addWeeks } from './utils/generateDays';
import { CreateScheduleDto, ScheduleItemDto, UpdateSessionDto } from './dtos/create-session.dto'
import { CourseState } from 'src/common/enums/courseState.enum';
import { plainToInstance } from 'class-transformer';
import { SessionResponseDto } from './dtos/sessions-rspone.dto';
import { timeToMinutes } from './utils/time';

interface RawSession{

  date : string;
  startTime: string;
  endTime: string;
}
@Injectable()
export class CourseSessionsService {
  constructor(
    @InjectRepository(Course) private courseRepo: Repository<Course>,
    @InjectRepository(CourseSessionSchedule) private scheduleRepo: Repository<CourseSessionSchedule>,
    @InjectRepository(CourseSession) private sessionRepo: Repository<CourseSession>,
    private dataSource: DataSource,
  ) {}

  async addSchedulesAndGenerateSessions(
    courseId: number,
    dto: CreateScheduleDto,
    instructorId:string) {
      return this.dataSource.transaction(async(manager)=>{
        const course = await manager.findOne(Course, {
      where: { id: courseId },
      relations: ['instructor'],
      lock: { mode: 'pessimistic_write' },
    });

    if (!course) throw new NotFoundException('Course not found');
    if(course.instructor.id !== instructorId){
      throw new BadRequestException('You are not the owner of this course')
    }
    if(course.status !== CourseState.DRAFT){
      throw new BadRequestException('Schedles can only be configured while the course is in draft')
    }
    if(!course.sessionsCount || course.sessionsCount<0){
      throw new BadRequestException('Course must have a valid sessions count before scheduling')
    }
    const existingSchedulesCount = await manager.count(CourseSessionSchedule,{
      where:{course:{id:courseId}}
    })
    if(existingSchedulesCount > 0){
      throw new BadRequestException(
        'Schedules already exist for this course. Use the regenerate endpoint instead.',
      );
    }
    this.validateScheduleItems(dto.schedules, course.sessionsCount)
    return this.generateScheduleAndSession(course,dto.schedules,manager)
   
  
  
  })}

  async getSessions(courseId: number) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    const sessions = await this.sessionRepo.find({
          where: { course: { id: courseId } },
          order: { sessionNumber: 'ASC' },
        });
    
        return plainToInstance(SessionResponseDto, sessions, {
          excludeExtraneousValues: true,
        });
  }
  async regenerateSchedule(
    courseId: number,
    dto: CreateScheduleDto,
    instructorId: string
  ){
    
    return this.dataSource.transaction(async (manager) => {
      const course = await manager.findOne(Course, {
        where: { id: courseId },
        relations: ['instructor'],
        lock: { mode: 'pessimistic_write' },
      })

        if (!course) throw new NotFoundException('Course not found');
    
        if (course.instructor.id !== instructorId) {
          throw new ForbiddenException('You are not the owner of this course');
        }
    
        if (course.status !== CourseState.DRAFT) {
          throw new BadRequestException(
            'Cannot regenerate schedule after the course has left draft status',
          );
        }
    
        if (!course.sessionsCount || course.sessionsCount <= 0) {
          throw new BadRequestException(
            'Course must have a valid sessions count before scheduling',
          );
        }
        this.validateScheduleItems(dto.schedules,course.sessionsCount)
          await manager.delete(CourseSession,{course: {id:courseId}})
          await manager.delete(CourseSessionSchedule,{course:{id:courseId}})
          return this.generateScheduleAndSession(course, dto.schedules,manager)
        })}
  async rescheduleSession(
    sessionId: number,
    dto:UpdateSessionDto,
    instructorId: string
  ){
    const session = await this.sessionRepo.findOne({
    where: { id: sessionId },
    relations: ['course', 'course.instructor'],
  });

  if (!session) throw new NotFoundException('Session not found');

  if (session.course.instructor.id !== instructorId) {
    throw new ForbiddenException('You are not the owner of this course');
  }
  if(new Date(session.date) < new Date(new Date().toDateString())){
    throw new BadRequestException('Cannot reschedule a past session')
  }
  if(session.course.status === CourseState.ARCHIVED){
    throw new BadRequestException('Cannot reschedule sessions of an archived course');
  }
  if(dto.date) session.date = new Date(dto.date)
  if(dto.startTime) session.startTime = dto.startTime
  if(dto.endTime) session.endTime = dto.endTime

  const saved = await this.sessionRepo.save(session)

  if(dto.date){
    const lastSession = await this.sessionRepo.findOne({
      where:{course:{id:session.course.id}}
      ,order:{date:'DESC'}
    })
    if (lastSession && lastSession.date.toString() !== session.course.endDate?.toString()) {
      await this.courseRepo.update(session.course.id, { endDate: lastSession.date });
    }
    return plainToInstance(SessionResponseDto, saved, {excludeExtraneousValues:true})
  }
  }

  private validateScheduleItems(items: ScheduleItemDto[], sessionsCount: number) {
      if (!items.length) {
        throw new BadRequestException('At least one schedule is required');
      }
      if (sessionsCount < 1) {
        throw new BadRequestException('Course must have at least one session');
      }
  
      const seenDays = new Set<string>();
  
      for (const item of items) {
        if (seenDays.has(item.day)) {
          throw new BadRequestException(
            `Day ${item.day} is used more than once. Each day can only have one schedule.`,
          );
        }
        seenDays.add(item.day);
  
        const startMinutes = timeToMinutes(item.startTime);
        const endMinutes = timeToMinutes(item.endTime);
  
        if (startMinutes >= endMinutes) {
          throw new BadRequestException(
            `Session start time must be before end time (day: ${item.day})`,
          );
        }
      }
    }
    
  private async generateScheduleAndSession(
    course : Course,
    scheduleItem: ScheduleItemDto[],
    manager: EntityManager
  ){
    const totalSchedules = scheduleItem.length;

      const baseSessionPerSchedule = Math.floor(course.sessionsCount / totalSchedules)
      let remainSessions = course.sessionsCount % totalSchedules

      const schedules = scheduleItem.map((item)=>
        manager.create(CourseSessionSchedule,{
          course,
          day: item.day,
          startTime: item.startTime,
          endTime: item.endTime
        })
      )
      await manager.save(schedules)
      const rawSessions: RawSession[] = [];

      for(const item of scheduleItem){
        let sessionsounterForThisSchedule = baseSessionPerSchedule;
        if(remainSessions>0){
          sessionsounterForThisSchedule+=1;
          remainSessions -=1
        }
        const firstDate = getFirstDateOnOrAfter(new Date(course.startDate), item.day)
        for(let j = 0 ; j< sessionsounterForThisSchedule;j++){
          const date = addWeeks(firstDate, j)
          rawSessions.push({date, startTime: item.startTime,endTime:item.endTime})
        }
      }
      rawSessions.sort((a,b)=> a.date.localeCompare(b.date))

      const sessions = rawSessions.map((s,index)=>
      manager.create(CourseSession,{
        course,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        sessionNumber: index + 1
      })
    )
    await manager.save(sessions)
    const lastSession = rawSessions[rawSessions.length - 1]
    await manager.update(Course, {id:course.id},{endDate: new Date(lastSession.date)})
    return {
      schedulesCreated: schedules.length,
      sessionsCreated: sessions.length,
      endDate: lastSession.date,

    } 
  }}
