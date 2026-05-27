import { MailerService } from '@nestjs-modules/mailer';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('mail')
export class MailProcessor extends WorkerHost {
  constructor(private readonly mailer: MailerService) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    switch (job.name) {
      case 'send-otp':
        await this.mailer.sendMail({
          to: job.data.email,
          subject: 'Email Verification',
          template: 'otp',
          context: { otp: job.data.otp },
        });
        break;

      default:
        break;
    }
  }
}


