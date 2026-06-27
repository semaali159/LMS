import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  ParseIntPipe,
  UseGuards,
  Put
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { CourseSessionsService } from './course-session.service';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/roles.enum';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import type { JwtPayload } from 'src/common/types/payload.interface';
import { CreateScheduleDto, UpdateSessionDto } from './dtos/create-session.dto';

@ApiTags('Course Sessions')
@Controller('courses/:courseId/sessions')
export class CourseSessionsController {
  constructor(private readonly courseService: CourseSessionsService) {}

  @Post('schedules')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Create schedules and generate sessions for a course (draft only)' })
  @ApiParam({
    name: 'courseId',
    description: 'course id that we generate its sessions ',
    example: 1,
  })
  @ApiBody({
    type: CreateScheduleDto,
    description: "session's info",
  })
    @ApiResponse({ status: 201, description: 'Schedules and sessions created, endDate computed automatically' })
  @ApiResponse({ status: 400, description: 'Invalid input or course not in draft' })
  @ApiResponse({ status: 403, description: 'Forbidden not the owner' })
  addSchedule(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() dto: CreateScheduleDto,
    @GetUser() instructor: JwtPayload,
  ) {
    return this.courseService.addSchedulesAndGenerateSessions(courseId, dto,instructor.userId);
  }

  @Put('schedule')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiOperation({summary: 'Regenerate schedules and sessions from scratch (draft only)'})
  @ApiParam({name: 'courseId', type: Number})
  @ApiBody({type: CreateScheduleDto})
   @ApiResponse({ status: 200, description: 'Schedules and sessions regenerated, endDate recomputed' })
  regenerateSchedulr(
    @Param('courseId', ParseIntPipe) courseId : number,
    @Body() dto: CreateScheduleDto,
    @GetUser() instructor: JwtPayload
  ){
    return this.courseService.regenerateSchedule(courseId,dto,instructor.userId)
  }

  @Put(':sessionId')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.INSTRUCTOR)
@ApiOperation({ summary: 'Reschedule a single session (date/time only, not the recurring pattern)' })
@ApiParam({ name: 'courseId', type: Number })
@ApiParam({ name: 'sessionId', type: Number })
@ApiBody({type: UpdateSessionDto})
rescheduleSession(
  @Param('sessionId', ParseIntPipe) sessionId: number,
  @Body() dto: UpdateSessionDto,
  @GetUser() instructor: JwtPayload,
) {
  return this.courseService.rescheduleSession(sessionId, dto, instructor.userId);
}

  @Get()
  @ApiOperation({ summary: "get all sessions for a course" })
  @ApiParam({
    name: 'courseId',
    description: 'course id',
    example: 1,
    type: Number
  })
  @ApiResponse({ status: 200, description: 'List of sessions' })
  getSessions(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.courseService.getSessions(courseId);
  }
}
