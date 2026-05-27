import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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

    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
      }),
    });

    const data = await res.json() as any;
    if (!res.ok) throw new Error(`Resend error: ${JSON.stringify(data)}`);
    this.logger.log(`Email enviado: ${data?.id}`);
  }

  async sendReportAlert(reporterId: string, report: { targetType: string; reason: string; questionId?: string; answerId?: string; targetUserId?: string }): Promise<void> {
    const apiKey = this.config.get<string>('SMTP_PASS');
    const from   = this.config.get<string>('SMTP_FROM') ?? 'noreply@biktus.com';
    const devEmail = 'elnicoares52@gmail.com';

    if (!apiKey) {
      this.logger.warn(`[DEV] Reporte recibido: ${JSON.stringify({ reporterId, ...report })}`);
      return;
    }

    const targetDesc = report.questionId
      ? `Pregunta ID: ${report.questionId}`
      : report.answerId
      ? `Respuesta ID: ${report.answerId}`
      : `Usuario ID: ${report.targetUserId}`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [devEmail],
        subject: `⚠️ Nuevo reporte de contenido — Biktus`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #fef2f2; border-radius: 12px; border-left: 4px solid #ef4444;">
            <h2 style="color: #dc2626; margin-bottom: 8px;">⚠️ Reporte de contenido</h2>
            <table style="width:100%; border-collapse:collapse; font-size:14px; color:#374151;">
              <tr><td style="padding:6px 0; font-weight:600;">Tipo:</td><td>${report.targetType}</td></tr>
              <tr><td style="padding:6px 0; font-weight:600;">Objetivo:</td><td>${targetDesc}</td></tr>
              <tr><td style="padding:6px 0; font-weight:600;">Reportado por:</td><td>${reporterId}</td></tr>
              <tr><td style="padding:6px 0; font-weight:600;">Motivo:</td><td>${report.reason}</td></tr>
            </table>
            <p style="margin-top:20px; color:#6b7280; font-size:13px;">Debes revisar y actuar en menos de 24 horas.</p>
          </div>
        `,
      }),
    });

    const data = await res.json() as any;
    if (!res.ok) this.logger.error(`Error enviando reporte: ${JSON.stringify(data)}`);
  }
}
