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

@Module({
  imports: [ LoggerModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    CourseModule,
    CourseSessionsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [jwtConfig,appConfig,databaseConfig],
    }),
  TypeOrmModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    console.log('DATABASE CONFIG:', configService.get('database'));

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
