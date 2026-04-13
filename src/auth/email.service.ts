import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private config: ConfigService) {}

  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    const apiKey = this.config.get<string>('SMTP_PASS');
    const from   = this.config.get<string>('SMTP_FROM') ?? 'noreply@biktus.com';

    if (!apiKey) {
      this.logger.warn(
        `[DEV] Código de recuperación para ${email}: ${code} — agrega SMTP_PASS para enviar emails reales.`,
      );
      return;
    }

    this.logger.log(`Enviando código a ${email} via Resend API...`);

    const { data } = await axios.post(
      'https://api.resend.com/emails',
      {
        from,
        to:      [email],
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
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    this.logger.log(`Email enviado: ${data?.id}`);
  }
}
