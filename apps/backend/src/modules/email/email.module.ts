import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { EmailCircuitBreakerService } from './email-circuit-breaker.service';

const logger = new Logger('EmailModule');

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.get<string>('SMTP_HOST', 'localhost');
        const isLocal = !host || host === 'localhost' || host === '127.0.0.1';
        const port = config.get<number>('SMTP_PORT', isLocal ? 1025 : 587);
        const user = config.get<string>('SMTP_USER', '');
        const pass = config.get<string>('SMTP_PASS', '');
        const fromName = config.get<string>('SMTP_FROM_NAME', 'OpenClubOS');
        const fromAddress = config.get<string>(
          'SMTP_FROM_ADDRESS',
          'noreply@localhost',
        );

        const transport: Record<string, any> = {
          host,
          port,
        };

        if (isLocal) {
          // Mailpit dev mode — no auth, no TLS
          transport.ignoreTLS = true;
          transport.secure = false;
          logger.log('Email: Using Mailpit (development)');
        } else {
          // Production cPanel SMTP — auth + TLS
          transport.secure = port === 465;
          transport.auth = { user, pass };
          transport.tls = { rejectUnauthorized: false };
          logger.log(`Email: Using SMTP relay at ${host} (production)`);
        }

        return {
          transport,
          defaults: {
            from: `"${fromName}" <${fromAddress}>`,
          },
        };
      },
    }),
  ],
  controllers: [EmailController],
  providers: [EmailService, EmailCircuitBreakerService],
  exports: [EmailService, EmailCircuitBreakerService],
})
export class EmailModule {}
