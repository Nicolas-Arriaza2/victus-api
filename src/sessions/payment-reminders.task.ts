import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentRemindersTask {
  private readonly logger = new Logger(PaymentRemindersTask.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  @Cron('0 9 * * *') // 9 AM daily
  async sendDailyReminders() {
    const now  = new Date();
    const d0   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const ms   = 86_400_000;

    const windows = [
      {
        from: new Date(d0.getTime() - ms),
        to:   new Date(d0.getTime() - 1),
        msg:  (t: string) => `Aún tienes un pago pendiente de "${t}". ¡Compléta tu pago para no perder tu lugar!`,
      },
      {
        from: d0,
        to:   new Date(d0.getTime() + ms - 1),
        msg:  (t: string) => `La sesión de "${t}" es hoy. Recuerda completar tu pago antes de llegar.`,
      },
      {
        from: new Date(d0.getTime() + ms),
        to:   new Date(d0.getTime() + 2 * ms - 1),
        msg:  (t: string) => `Mañana es la sesión de "${t}". Asegura tu lugar completando el pago.`,
      },
    ];

    let total = 0;

    for (const w of windows) {
      const sessions = await this.prisma.activitySession.findMany({
        where: { startsAt: { gte: w.from, lte: w.to } },
        include: { activity: true },
      });

      for (const session of sessions) {
        const pending = await this.prisma.activityEnrollment.findMany({
          where: {
            sessionId: session.id,
            status:        { not: 'cancelled' },
            paymentStatus: 'pending_payment',
          },
          select: { userId: true },
        });

        await Promise.all(
          pending.map((e) =>
            this.notifications.create(
              e.userId,
              'payment_received',
              'Recordatorio de pago',
              w.msg(session.activity.title),
              { sessionId: session.id, activityId: session.activityId },
            ),
          ),
        );
        total += pending.length;
      }
    }

    this.logger.log(`Recordatorios de pago enviados: ${total}`);
  }
}
