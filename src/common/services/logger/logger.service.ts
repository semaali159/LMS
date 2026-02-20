import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { createLogger, format, transports, Logger as WinstonLogger } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLoggerService implements LoggerService {
  private readonly logger: WinstonLogger;

  constructor() {
    const isProduction = process.env.NODE_ENV === 'production';

    const commonFormat = format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.errors({ stack: true }),
      format.splat(),
      format.json(),
    );

    const consoleFormat = format.combine(
      format.colorize(),
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.printf(({ timestamp, level, message, context, ...meta }) => {
        const ctx = context ? `[${context}] ` : '';
        const metaStr =
          Object.keys(meta).length > 0
            ? `\n${JSON.stringify(meta, null, 2)}`
            : '';
        return `${timestamp} ${level.toUpperCase()} ${ctx}${message}${metaStr}`;
      }),
    );

    this.logger = createLogger({
      level: isProduction ? 'info' : 'debug',
      defaultMeta: { service: 'app-backend' },
      format: commonFormat,
      transports: [
        new transports.Console({
          format: isProduction ? commonFormat : consoleFormat,
        }),
        new DailyRotateFile({
          filename: 'logs/application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          level: 'info',
        }),
        new DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '30d',
          level: 'error',
        }),
      ],
    });
  }


  private buildMeta(context?: string, meta?: Record<string, any>) {
    return {
      ...(context && { context }),
      ...(meta || {}),
    };
  }

  log(message: string, context?: string, meta?: Record<string, any>): void {
    this.logger.info(message, this.buildMeta(context, meta));
  }

  error(
    message: string,
    trace?: string,
    context?: string,
    meta?: Record<string, any>,
  ): void {
    this.logger.error(message, {
      ...this.buildMeta(context, meta),
      ...(trace && { trace }),
    });
  }

  warn(message: string, context?: string, meta?: Record<string, any>): void {
    this.logger.warn(message, this.buildMeta(context, meta));
  }

  debug(message: string, context?: string, meta?: Record<string, any>): void {
    this.logger.debug(message, this.buildMeta(context, meta));
  }

  verbose(message: string, context?: string, meta?: Record<string, any>): void {
    this.logger.verbose(message, this.buildMeta(context, meta));
  }

  http(
    method: string,
    url: string,
    status: number,
    duration: number,
    userId?: string | number,
  ) {
    const level = status >= 400 ? 'warn' : 'info';

    this.logger.log(level, `${method} ${url} ${status} ${duration}ms`, {
      context: 'HTTP',
      status,
      duration,
      ...(userId && { userId }),
    });
  }
}
