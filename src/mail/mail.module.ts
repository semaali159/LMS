import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { join } from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailProcessor } from './mail.processor';
@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host:config.get<string>('mailer.host'),
          port:config.get<number>('mailer.port'),
          secure: false,
          auth: {
            user: config.get<string>('mailer.user'),
            pass: config.get<string>('mailer.pass'),
          },
        },
        template: {
          dir: join(process.cwd(), 'src', 'mail', 'templates'),
          adapter: new HandlebarsAdapter(),
          options: { strict: true },
        },
        
      }),
      
    }),
  ],
  providers: [MailService, MailProcessor],
  exports: [MailService], 
})
export class MailModule {}