import { MailerService } from '@nestjs-modules/mailer';
import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('mail')
export class MailProcessor {
  constructor(private mailer: MailerService) {}

  async process(job: Job) {
    if (job.name === 'send-otp') {
      return this.handleSendOtp(job);
    }
  }

  async handleSendOtp(job: Job) {
    const { email, otp } = job.data;

    await this.mailer.sendMail({
      to: email,
      subject: 'Email Verification',
      template: 'otp',
      context: { otp },
    });
  }
}


