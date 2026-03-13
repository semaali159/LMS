import { Controller, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { EnrollmentService } from "./Enrollment.service";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { GetUser } from "src/common/decorators/get-user.decorator";
import { Roles } from "src/common/decorators/roles.decorator";
import { Role } from "src/common/enums/roles.enum";
import * as payloadInterface from "src/common/types/payload.interface";
import { CourseEnrollmentGuard } from "src/courses/guards/courseEnrollment.guard";

@ApiTags('Enrollment')
@Controller('enrollment')
export class EnrollementController{
    constructor(private readonly EnrollmentServie: EnrollmentService){
    }

      @Post(':id/enroll')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard,CourseEnrollmentGuard)
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Enroll in a course (Student only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Student enrolled successfully' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  enroll(
    @Param('id') courseId: number,
    @GetUser() student: payloadInterface.JwtPayload,
  ) {
    return this.EnrollmentServie.enroll(courseId, student.userId);
  }
  @Get('my/enrolled')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get all student courses that he enrolled it (Student only)' })
getMyEnrolledCourses(
    @GetUser() student: payloadInterface.JwtPayload) {
  return this.EnrollmentServie.getEnrolledCourses(student.userId);
}

@Get('pending/:id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Get all pending enrollment request (Instructor only)' })
  @ApiParam({ name: 'id', type: Number })
getPendingEnrollment(
    @Param('id') courseId:number,
    @GetUser() instructor:payloadInterface.JwtPayload)
{
return this.EnrollmentServie.getAllPendingEnrollment(courseId,instructor.userId)
}



@Put('accepte/:id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR,Role.ADMIN)
  @ApiOperation({ summary: 'Accepte an enrollment (Instructor only)' })
  @ApiParam({ name: 'id', type: Number })
accepteEnroll(
    @Param('id') enrollmentId: number,
    @GetUser() instructor : payloadInterface.JwtPayload
){
    return this.EnrollmentServie.accepteEnrollment(enrollmentId, instructor.userId)
}

@Put('reject/:id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @ApiOperation({ summary: 'Reject an enrollment (Instructor only)' })
  @ApiParam({ name: 'id', type: Number })
rejectEnroll(
    @Param('id') enrollmentId: number,
    @GetUser() instructor : payloadInterface.JwtPayload
){
    return this.EnrollmentServie.rejectEnrollment(enrollmentId, instructor.userId)
}

}
