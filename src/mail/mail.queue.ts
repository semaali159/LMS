import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

export const MAIL_QUEUE = 'MAIL_QUEUE';

export const MailQueueProvider: Provider = {
  provide: MAIL_QUEUE,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    return new Queue('mail', {
      connection: {
        host: config.get<string>('redis.host'),
        port: config.get<number>('redis.port'),
      },
    });
  },
};
