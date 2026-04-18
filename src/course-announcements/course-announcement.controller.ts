import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { CourseAnnouncementService } from "./course-announcement.service";
import { Role } from "src/common/enums/roles.enum";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { Roles } from "src/common/decorators/roles.decorator";
import { GetUser } from "src/common/decorators/get-user.decorator";
import type { JwtPayload } from "src/common/types/payload.interface";
import { CreateCourseAnnouncementDTO } from "./dtos/create-course-annoucement.dto";

@ApiTags("Course Announcement")
@Controller("course/:courseId/announcement")
@UseGuards(JwtAuthGuard)
export class CourseAnnouncementController {
  constructor(
    private readonly courseAnnouncementService: CourseAnnouncementService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Create announcement (instructor only)" })
  create(
    @Param("courseId", ParseIntPipe) courseId: number,
    @GetUser() user: JwtPayload,
    @Body() dto: CreateCourseAnnouncementDTO,
  ) {
    return this.courseAnnouncementService.create(courseId, user.userId, dto);
  }

  @Get("student")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Get all announcements for enrolled student" })
  getAnnouncementForStudent(
    @Param("courseId", ParseIntPipe) courseId: number,
    @GetUser() user: JwtPayload,
  ) {
    return this.courseAnnouncementService.listForStudent(courseId, user.userId);
  }

  @Get("instructor")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Get all announcements with stats (course owner)" })
  getAnnouncementForInstructor(
    @Param("courseId", ParseIntPipe) courseId: number,
    @GetUser() user: JwtPayload,
  ) {
    return this.courseAnnouncementService.listForCourseInstructor(
      courseId,
      user.userId,
    );
  }

  @Get(":announcementId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Get one announcement and mark as read" })
  getAnnouncementById(
    @Param("courseId", ParseIntPipe) courseId: number,
    @Param("announcementId", ParseIntPipe) announcementId: number,
    @GetUser() user: JwtPayload,
  ) {
    return this.courseAnnouncementService.getAnnouncement(

      announcementId,
      user.userId,
    );
  }
}
