import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from "@nestjs/common";
import { QuizService } from "./quiz.service";
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { GetUser } from "src/common/decorators/get-user.decorator";
import { Roles } from "src/common/decorators/roles.decorator";
import { CreateQuizDto } from "./dtos/create-quiz.dto";
import { Role } from "src/common/enums/roles.enum";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import type { JwtPayload } from "src/common/types/payload.interface";
import { SubmitQuizDto } from "./dtos/create-quiz-submission.dto";

@Controller('quiz')
export class QuizController{

    constructor(private readonly quizService: QuizService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new quiz for a session' })
  create(@Body() dto: CreateQuizDto, @GetUser() user: any) {
    return this.quizService.create(dto, user.userId);
  }

  @Get('session/:sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get a quiz by session id (only for enrolled students)' })
  getBySession(@Param('sessionId', ParseIntPipe) id: number, @GetUser() user: JwtPayload){
    return this.quizService.getBySessionId(id, user.userId)
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get quiz by id with details (only for enrolled students)' })
  getOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: JwtPayload){
    return this.quizService.getOne(id, user.userId)
  }

  @Post(':id/start')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.STUDENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Start a quiz' })
  start(@Param('id', ParseIntPipe) id: number, @GetUser() user:JwtPayload){
    return this.quizService.startQuiz(id,user.userId)
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.STUDENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Submit quiz answer' })
  submit(@Param('id', ParseIntPipe) id: number, @GetUser() user:JwtPayload, @Body() dto:SubmitQuizDto){
    return this.quizService.submitAnswer(id,user.userId,dto)
  }

  @Get(':id/result')
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles(Role.STUDENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get student quiz result' })
  getResult(@Param('id', ParseIntPipe) id: number, @GetUser() user:JwtPayload){
    return this.quizService.getStudentResult(id,user.userId)
  }

  
  @Get(':id/result/all')
  @UseGuards(JwtAuthGuard,RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get student quiz result' })
  getAllResult(@Param('id', ParseIntPipe) id: number, @GetUser() user:JwtPayload){
    return this.quizService.getAllResult(id,user.userId)
  }
}