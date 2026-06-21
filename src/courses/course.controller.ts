import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Put,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { CourseService } from './course.service';

import type { JwtPayload } from '../common/types/payload.interface';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/roles.enum';
import { CreateCourseDto, RejectCourseDto, UpdateCourseDto } from './dtos/course.dto';

import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { CourseEnrollmentGuard } from './guards/courseEnrollment.guard';
import { CourseState } from 'src/common/enums/courseState.enum';

@ApiTags('Courses')
@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Create a new course (instructor only)' })
  @ApiBody({ type: CreateCourseDto })
  @ApiResponse({ status: 201, description: 'Course successfully created' })
  @ApiResponse({ status: 403, description: 'Forbidden only instructor allowed' })
  createCourse(
    @GetUser() instructor: JwtPayload,
    @Body() dto: CreateCourseDto,
  ) {
    return this.courseService.create(dto, instructor.userId);
  }

  @Put(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Update an existing course (instructor only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateCourseDto })
  @ApiResponse({ status: 200, description: 'Course updated successfully' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  updateCourse(
    @Param('id') courseId: number,
    @GetUser() instructor: JwtPayload,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.courseService.update(courseId, dto, instructor.userId);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Delete a course (instructor only)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Course deleted' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  deleteCourse(
    @Param('id') courseId: number,
    @GetUser() instructor: JwtPayload,
  ) {
    return this.courseService.deleteCourse(courseId, instructor.userId);
  }

  @Get('my-courses')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Get all courses owned by the logged-in instructor' })
  @ApiResponse({ status: 200, description: 'List of all courses returned' })
  @ApiQuery({name: 'status', required: false, enum: CourseState})
  getMyCourses(
    @GetUser() instructor: JwtPayload,
    @Query('status') status?: CourseState 
  ) {
    return this.courseService.getAllCoursesForInstructor(instructor.userId,status)
  }

  @Get('my-courses/:id')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiOperation({summary: 'Get one course owned by the logged-in instructor'})
  @ApiParam({name: 'id', type: Number})
  @ApiResponse({status: 404, description: 'Course not found'})
  getMyCourseCyId(
    @GetUser() instructor : JwtPayload,
    @Param('id', ParseIntPipe) id: number
  ){
    return this.courseService.getOneCourseForInstructor(id,instructor.userId)
  }

  @Get()
  @ApiOperation({summary:'Get all published courses (Public)'})
  @ApiResponse({status:200, description: 'List of published courses'})
  getAllCourses(){
    return this.courseService.getAll()
  }

  @Get(':id')
  @ApiOperation({summary:'get published course details (Public)'})
  @ApiParam({name:'id' , type: Number})
  @ApiResponse({ status: 200, description: 'Course details returned' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  getOne(@Param('id', ParseIntPipe) id: number){
    return this.courseService.getOne(id)
  }
  
  @Get(':id/details')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN,Role.INSTRUCTOR)
  @ApiOperation({summary: 'get full course details with active enrollments (Instructor and admin)'})
  @ApiParam({name:'id', type: Number})
  @ApiResponse({ status: 403, description: 'Forbidden not the owner or admin' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  getOneDetailed(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: JwtPayload
  ){
    return this.courseService.getOneDetailed(id, user)
  }




  @Put(":id/submit")
  @ApiBearerAuth('acess-token')
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiOperation({summary:'submit a course for review (instrutor only)'})
  @ApiParam({name:'id', type:Number})
  @ApiResponse({status:200, description:'course submitted successfully'})
  submit(
    @Param('id', ParseIntPipe) courseId:number,
    @GetUser() instructor:JwtPayload){
      return this.courseService.submitForReview(courseId,instructor.userId)
    }

   @Put(":id/approve")
   @ApiBearerAuth('access-token')
   @UseGuards(JwtAuthGuard,RolesGuard)
   @Roles(Role.ADMIN)
   @ApiOperation({summary:"Approve and publish a course (Admin only)"})
   @ApiParam({ name: 'id', type: Number })
   @ApiResponse({status:200, description:"course published successfully"})
   approve(
    @Param("id", ParseIntPipe) courseId: number
   ){ 
    return this.courseService.ApprovePublishCourse(courseId)
   } 

   @Put(":id/reject")
   @ApiBearerAuth('access-token')
   @UseGuards(JwtAuthGuard,RolesGuard)
   @Roles(Role.ADMIN)
   
   @ApiParam({ name: 'id', type: Number })
   @ApiBody({ type: RejectCourseDto })
   @ApiOperation({summary:"Reject publish a course (only admin)"})
   @ApiResponse({status:200, description:"course has rejectd"})
   reject(
    @Param("id", ParseIntPipe) courseId: number,
    @Body() reason: RejectCourseDto
   ){ 
    return this.courseService.rejectPublishCourse(courseId,reason.reason)
   }

   @Put(":id/archive")
   @ApiBearerAuth('access-token')
   @UseGuards(JwtAuthGuard,RolesGuard)
   @Roles(Role.ADMIN,Role.INSTRUCTOR)
   @ApiOperation({summary: "Archive a course (admin and instructor)"})
   @ApiParam({ name: 'id', type: Number })
   @ApiResponse({status:200, description:"course archived successfuly"})
   archive(
    @Param("id", ParseIntPipe) courseId: number,
    @GetUser() user:JwtPayload
   ){
    return this.courseService.ArchivedCourse(courseId,user)
   }

}
