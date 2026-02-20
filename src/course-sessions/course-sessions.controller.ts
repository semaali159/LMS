import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  ParseIntPipe,
  UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

import { CreateSchedulesDto } from './dtos/create-session.dto';
import { CourseSessionsService } from './course-session.service';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/roles.enum';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import type { JwtPayload } from 'src/common/types/payload.interface';

@ApiTags('Course Sessions')
@Controller('CourseSessions')
export class CourseSessionsController {
  constructor(private readonly courseService: CourseSessionsService) {}

  @Post(':id/schedules')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiOperation({ summary: 'auto sessions' })
  @ApiParam({
    name: 'id',
    description: 'course id that we generate its sessions ',
    example: 1,
  })
  @ApiBody({
    type: CreateSchedulesDto,
    description: "session's info",
  })
  @ApiResponse({
    status: 201,
    description: 'added successfully',
    schema: {
      example: {
        schedulesCreated: 2,
        sessionsCreated: 12,
      },
    },
  })
  addSchedule(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateSchedulesDto,
    @GetUser() instructor: JwtPayload,
  ) {
    return this.courseService.addSchedulesAndGenerateSessions(id, dto);
  }

  @Get(':id/sessions')
  @ApiOperation({ summary: "get all course's sesions" })
  @ApiParam({
    name: 'id',
    description: 'course id',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'sessions list',
    example: [
      {
        id: 1,
        date: '2025-01-01',
        startTime: '19:00',
        endTime: '21:00',
        sessionNumber: 1,
      },
      {
        id: 2,
        date: '2025-01-08',
        startTime: '19:00',
        endTime: '21:00',
        sessionNumber: 2,
      },
    ],
  })
  getSessions(@Param('id', ParseIntPipe) id: number) {
    return this.courseService.getSessions(id);
  }
}
