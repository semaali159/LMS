import { Worker, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

export class MailProcessor {
  constructor(
    private config: ConfigService,
    private mailer: MailerService,
  ) {
    new Worker(
      'mail',
      async (job: Job) => {
        if (job.name === 'send-otp') {
          const { email, otp } = job.data;

          await this.mailer.sendMail({
            to: email,
            subject: 'Email Verification',
            template: 'otp',
            context: { otp },
          });
        }
      },
      {
        connection: {
          host: this.config.get('redis.host'),
          port: this.config.get('redis.port'),
        },
      },
    );
  }
}
