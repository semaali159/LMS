import {
  Controller,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AssignmentService } from './assignment.service';
import { CreateAssignmentDto } from './dtos/createAssignment.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/roles.enum';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import type { JwtPayload } from 'src/common/types/payload.interface';

@ApiTags('Assignments')
@Controller('courses/:courseId/assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.INSTRUCTOR)
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        dueDate: { type: 'string', format: 'date-time' },
        submissionType: {
          type: 'string',
          enum: ['FILE', 'TEXT'],
        },
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['title', 'submissionType'],
    },
  })
  createAssignment(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() dto: CreateAssignmentDto,
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: JwtPayload,
  ) {
    return this.assignmentService.create(courseId, dto, user.userId, file);
  }
    @Get()
  @ApiBearerAuth('access-token')
  getCourseAssignments(
    @Param('courseId', ParseIntPipe) courseId: number,
  ) {
    return this.assignmentService.getCourseAssignments(courseId);
  }
}
