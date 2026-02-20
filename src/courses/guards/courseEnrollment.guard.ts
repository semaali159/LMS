import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { Course } from '../course.entity';
import { ALLOWED_COURSE_STATUSES_KEY } from 'src/common/decorators/allowed-course-statuses.decorator';
import { CourseState } from 'src/common/enums/courseState.enum';

import { AppLoggerService } from '../../common/services/logger/logger.service'; 

interface CourseAccessMetadata {
  course: Course;
  isAccessible: boolean;
  reason?: string;
}

@Injectable()
export class CourseEnrollmentGuard implements CanActivate {
 private readonly logger: AppLoggerService;
  constructor(
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    private readonly reflector: Reflector,
    logger: AppLoggerService,
  ) {
    this.logger = logger;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
  const request = context.switchToHttp().getRequest<
  Request<{ id: string }> & {
    course?: Course;
    courseAccess?: CourseAccessMetadata;
  }
>();
    const courseIdParam = request.params.id;
// this.logger.log(`${courseIdParam}`)
    const courseId = this.parseCourseId(courseIdParam);
    const course = await this.fetchCourse(courseId);
    if (!course) {
      this.logger.warn(`Course not found`, 'CourseEnrollmentGuard', { courseId });
      throw new NotFoundException('Course not found');
    }
    const accessResult = this.evaluateCourseAccess(course, context);

    if (!accessResult.isAccessible) {
      this.throwAppropriateException(accessResult);
    }

    request.course = course;
    request.courseAccess = accessResult;
const userId = request.user?.id;

if (!userId) {
  throw new UnauthorizedException('User ID not found in request');
}
  this.logger.log(
      'Course enrollment allowed',
      'CourseEnrollmentGuard',
      {
        courseId,
        status: course.status,
        userId: request.user?.id ?? 'anonymous',
      },
    );

    return true;
  }

  private parseCourseId(param: string | undefined): number {
    // this.logger.log(`${param}`)
    const id = Number(param);
    // this.logger.log(`${id}`)
    if (!param || Number.isNaN(id) || id <= 0) {
      throw new BadRequestException('Invalid course ID');
    }
    return id;
  }

  private async fetchCourse(id: number): Promise<Course> {
    const course = await this.courseRepository.findOne({
      where: { id },
    });

    if (!course) {
      this.logger.warn(`Course not found`, 
  'CoursesService',{ courseId: id });
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  private evaluateCourseAccess(course: Course, context: ExecutionContext): CourseAccessMetadata {
    const allowedStatuses = this.reflector.getAllAndOverride<CourseState[]>(
      ALLOWED_COURSE_STATUSES_KEY,
      [context.getHandler(), context.getClass()],
    ) ?? [CourseState.PUBLISHED];

    if (!allowedStatuses.includes(course.status)) {
      return {
        course,
        isAccessible: false,
        reason: `Course status (${course.status}) is not in allowed list: ${allowedStatuses.join(', ')}`,
      };
    }

    if (course.endDate && course.endDate < new Date()) {
      return {
        course,
        isAccessible: false,
        reason: 'Enrollment period has ended',
      };
    }

    return {
      course,
      isAccessible: true,
    };
  }

  private throwAppropriateException({ reason }: CourseAccessMetadata): never {
 throw new ForbiddenException(reason ?? 'Enrollment not allowed for this course');
  }
}