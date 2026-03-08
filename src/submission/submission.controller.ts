import {
  Controller,
  Post,
  Patch,
  Param,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  ParseIntPipe,
  Body,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SubmissionService } from './submission.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/roles.enum';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import type { JwtPayload } from 'src/common/types/payload.interface';
import { GradeSubmissionDto } from './dtos/gradeSubmission.dto';
import { ApiResponse } from 'src/common/dtos/api-response.dto';

@ApiTags('Submissions')
@ApiBearerAuth()
@Controller('assignments/:assignmentId/submissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubmissionController {
  constructor(private readonly submissionService: SubmissionService) {}

  @Post()
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Student submits assignment solution' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async submit(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: JwtPayload,
  ): Promise<ApiResponse<any>> {
    const submission = await this.submissionService.submit(
      assignmentId,
      file,
      user.userId,
    );

    return {
      success: true,
      message: 'Submission uploaded successfully',
      data: submission,
    };
  }

  @Get('my-submission')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Student views his submission' })
  async getMySubmission(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @GetUser() user: JwtPayload,
  ): Promise<ApiResponse<any>> {
    const submission = await this.submissionService.getMySubmission(
      assignmentId,
      user.userId,
    );

    return {
      success: true,
      data: submission,
    };
  }

  @Get()
  @Roles(Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Teacher views all submissions for assignment' })
  async getAssignmentSubmissions(
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @GetUser() user: JwtPayload,
  ): Promise<ApiResponse<any>> {
    const submissions =
      await this.submissionService.getAssignmentSubmissions(
        assignmentId,
        user.userId,
      );

    return {
      success: true,
      data: submissions,
    };
  }

  // ================= TEACHER GRADE =================
  @Patch(':submissionId/grade')
  @Roles(Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Teacher grades a submission' })
  async grade(
    @Param('submissionId', ParseIntPipe) submissionId: number,
    @Body() dto: GradeSubmissionDto,
    @GetUser() user: JwtPayload,
  ): Promise<ApiResponse<any>> {
    const submission = await this.submissionService.grade(
      submissionId,
      dto,
      user.userId,
    );

    return {
      success: true,
      message: 'Submission graded successfully',
      data: submission,
    };
  }
}
