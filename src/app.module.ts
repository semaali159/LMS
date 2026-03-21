import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import jwtConfig from './config/jwt.config';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { LoggerModule } from './common/services/logger/logger.module';
import { CourseSessionsModule } from './course-sessions/course-sessions.module';
import { CourseModule } from './courses/course.module';
import { ProfilesModule } from './profiles/profile.module';
import { UsersModule } from './User/user.module';
import { EnrollmentModule } from './Enrollments/Enrollment.module';
import { SubmissionModule } from './submission/submission.module';
import { AssignmentModule } from './assignment/assignment.module';
import storageConfig from './config/storage.config';
import { QuizModule } from './quiz/quiz.module';
import redisConfig from './config/redis.config';
import { RedisModule } from 'nestjs-redis';
import mailerConfig from './config/mailer.config';

@Module({
  imports: [ LoggerModule,
    EnrollmentModule,
    AssignmentModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    CourseModule,
    SubmissionModule,
    CourseSessionsModule,
    QuizModule,
    RedisModule,
    ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
          load: [
            jwtConfig,
            appConfig,
            databaseConfig,
            storageConfig,
            redisConfig,
            mailerConfig
               ],
    }),
     TypeOrmModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
           return {
              type: 'postgres',
              url: configService.getOrThrow<string>('database.url'),
              autoLoadEntities: true,
              synchronize: true,
              ssl: {
                   rejectUnauthorized: false,
                   },
              retryAttempts: 10,
              retryDelay: 3000,
              keepConnectionAlive: true,
    };
    },
    })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
