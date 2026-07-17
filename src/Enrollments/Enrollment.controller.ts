import { Controller, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from "@nestjs/common";
import { EnrollmentService } from "./Enrollment.service";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { GetUser } from "src/common/decorators/get-user.decorator";
import { Roles } from "src/common/decorators/roles.decorator";
import { Role } from "src/common/enums/roles.enum";
import * as payloadInterface from "src/common/types/payload.interface";
import { CourseEnrollmentGuard } from "src/courses/guards/courseEnrollment.guard";
import type { JwtPayload } from "src/common/types/payload.interface";
import { EnrollmentQueryService } from "./EnrollmentService/EnrollmentQuery.service";

@ApiTags('Enrollments')
@Controller('courses/:courseId/enrollments')
export class EnrollementController{
    constructor(
      private readonly EnrollmentServie: EnrollmentService,
      private readonly EnrollmentReviewService:EnrollmentQueryService
    ){
    }

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard,CourseEnrollmentGuard)
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Enroll in a course (Student only)' })
  @ApiParam({ name: 'courseId', type: Number })
  @ApiResponse({ status: 20, description: 'Student enrolled successfully (PENDING, WAITLISTED or ACTIVE)' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  enroll(
    @Param('courseId', ParseIntPipe) courseId: number,
    @GetUser() student: payloadInterface.JwtPayload,
  ) {
    return this.EnrollmentServie.enroll(courseId, student.userId);
  }

@Get('pending')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Get all pending enrollments request (Instructor only)' })
  @ApiParam({ name: 'courseId', type: Number })
  @ApiQuery({name:'page', required:false, type:Number})
  @ApiQuery({name:'limit', required:false, type:Number})
  getPendingEnrollment(
    @Param('courseId', ParseIntPipe) courseId:number,
    @GetUser() instructor:payloadInterface.JwtPayload,
    @Query('page') page?:number,
    @Query('limit') limit?: number
  )
  {
    return this.EnrollmentReviewService.getPendingEnrollment(courseId,instructor.userId,{page,limit})
  }

  @Get('waitlist')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiOperation({summary:'Get waitlisted enrollments for a course (Instructor only)'})
  @ApiParam({name: 'ourseId' , type:Number})
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getWaitlistedEnrollments(
    @Param('courseId', ParseIntPipe) courseId: number,
    @GetUser() instructor: JwtPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ){
    return this.EnrollmentReviewService.getWaitlistedEnrollments(courseId,instructor.userId,{page,limit})
  }


  @Put(':enrollmentId/accept')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Accepte a pending enrollment (Instructor only)' })
  @ApiParam({ name: 'courseId', type: Number })
  @ApiParam({ name: 'enrollmentId', type: Number })
accepteEnrollment(
    @Param('enrollmentId',ParseIntPipe) enrollmentId: number,
    @GetUser() instructor : JwtPayload
){
    return this.EnrollmentReviewService.acceptEnrollment(enrollmentId, instructor.userId)
}

  @Put(':enrollmentId/reject')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Reject a pending enrollment (Instructor only)' })
  @ApiParam({ name: 'courseId', type: Number })
  @ApiParam({ name: 'enrollmentId', type: Number })
  rejectEnroll(
    @Param('enrollmentId',ParseIntPipe) enrollmentId: number,
    @GetUser() instructor : JwtPayload
){
    return this.EnrollmentReviewService.rejectEnrollment(enrollmentId, instructor.userId)
}}
// separate constroller for student

@ApiTags('My Enrollment')
@Controller('enrollments')
export class MyEnrollmentsController{
  constructor(private readonly enrollmentService:EnrollmentService){}


  @Get('my')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Get all mt enrollments (Student only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMyEnrollments(
    @GetUser() student: JwtPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ){
  return this.enrollmentService.getMyEnrollments(student.userId,{page,limit});
}

@Put(':enrollmentId/cancel')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard,RolesGuard)
@Roles(Role.STUDENT)
@ApiOperation({summary:'Cancel a pending or waitlisted enrolllment'})
@ApiParam({name:'enrollmentId', type:Number})
cancelEnrollment(
  @Param('enrollmentId', ParseIntPipe) enrollmentId:number,
  @GetUser() student:JwtPayload
){
  return this.enrollmentService.cancelEnrollment(enrollmentId,student.userId)
}

@Put(':enrollmentId/drop')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard,RolesGuard)
@Roles(Role.STUDENT)
@ApiOperation({summary:'drop an active enrollment (student only)'})
@ApiParam({name:'enrollmentId', type:Number})
dropEnrollment(
  @Param('enrollmentId', ParseIntPipe ) enrollmentId:number,
  @GetUser() student: JwtPayload
){
  return this.enrollmentService.dropEnrollment(enrollmentId,student.userId)
}
  

}

  

