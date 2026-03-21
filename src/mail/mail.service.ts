import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private mailer: MailerService) {}

  async sendOtp(email: string, otp: string) {
    await this.mailer.sendMail({
      to: email,
      subject: 'Email Verification',
      template: 'otp',
      context: {
        otp,
      },
    });
  }
}
