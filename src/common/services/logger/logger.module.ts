// src/common/logger/logger.module.ts
import { Global, Module } from '@nestjs/common';
import { AppLoggerService } from './logger.service';

@Global()
@Module({
  providers: [AppLoggerService],
  exports: [AppLoggerService],
})
export class LoggerModule {}