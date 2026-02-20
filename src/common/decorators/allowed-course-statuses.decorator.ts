// allowed-course-statuses.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { CourseState } from '../enums/courseState.enum';

export const ALLOWED_COURSE_STATUSES_KEY = 'allowed_course_statuses';

export const AllowedCourseStatuses = (...statuses: CourseState[]) =>
  SetMetadata(ALLOWED_COURSE_STATUSES_KEY, statuses);