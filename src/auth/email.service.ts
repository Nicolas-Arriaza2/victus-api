import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private config: ConfigService) {
    const host = config.get<string>('SMTP_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(config.get<string>('SMTP_PORT') ?? '587'),
        secure: config.get<string>('SMTP_PORT') === '465',
        auth: {
          user: config.get<string>('SMTP_USER'),
          pass: config.get<string>('SMTP_PASS'),
        },
      });
    }
  }

  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    const from = this.config.get<string>('SMTP_FROM') ?? 'noreply@biktus.com';

    if (!this.transporter) {
      this.logger.warn(
        `[DEV] Código de recuperación para ${email}: ${code} — configura SMTP_HOST para enviar emails reales.`,
      );
      return;
    }

    await this.transporter.sendMail({
      from,
      to: email,
      subject: 'Código para restablecer tu contraseña — Biktus',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
          <h2 style="color: #2D7E34; margin-bottom: 8px;">Restablecer contraseña</h2>
          <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            Recibiste este correo porque solicitaste restablecer tu contraseña en Biktus.
          </p>
          <p style="color: #374151; font-size: 15px;">Tu código de verificación es:</p>
          <div style="background: #fff; border: 2px solid #2D7E34; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
            <span style="font-size: 40px; font-weight: 800; letter-spacing: 10px; color: #2D7E34;">${code}</span>
          </div>
          <p style="color: #6b7280; font-size: 13px;">
            Este código expira en <strong>15 minutos</strong>. Si no solicitaste esto, ignorá este email.
          </p>
        </div>
      `,
    });
  }
}
