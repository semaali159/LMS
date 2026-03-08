import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ProfilesService } from './profile.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/roles.enum';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
@ApiTags('Profiles')
@ApiBearerAuth('access-token')
@Controller('profiles')
export class ProfilesController {
constructor(private profilesService: ProfilesService) {}
@Post('student/:userId')
@UseGuards(AuthGuard('jwt'),RolesGuard)
  @Roles(Role.STUDENT)
    @ApiOperation({ summary: 'Create student profile' })
  @ApiParam({ name: 'userId', type: String, example: 12 })
  @ApiBody({
    schema: {
      properties: {
        gradeLevel: { type: 'string', example: 'Grade 10' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Student profile created successfully' })
createStudent(
@Param('userId') userId: string,
@Body() body: { gradeLevel?: string },
) {
return this.profilesService.createStudentProfile(userId, body.gradeLevel);
}
@Post('instructor/:userId')
@UseGuards(AuthGuard('jwt'),RolesGuard)
@Roles(Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Create instructor profile' })
  @ApiParam({ name: 'userId', type: String, example: 12 })
  @ApiBody({
    schema: {
      properties: {
        specialty: { type: 'string', example: 'physics' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'instructor profile created successfully' })
createTeacher(
@Param('userId') userId: string,
@Body() body: { specialty?: string },
) {
return this.profilesService.createInstructorProfile(userId, body.specialty);
}
}