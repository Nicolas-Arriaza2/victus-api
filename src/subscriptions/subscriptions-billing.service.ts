import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MercadoPagoService } from '../payments/mercadopago.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SubscriptionsBillingService {
  private readonly logger = new Logger(SubscriptionsBillingService.name);

  constructor(
    private prisma: PrismaService,
    private mp: MercadoPagoService,
    private notifications: NotificationsService,
    private config: ConfigService,
  ) {}

  @Cron('0 9 * * *', { timeZone: 'America/Santiago' })
  async generateMonthlyBillings() {
    this.logger.log('Running monthly billing generation...');
    const now = new Date();

    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        status: 'active',
        currentPeriodEnd: { lte: now },
      },
      include: { activity: true },
    });

    this.logger.log(`Found ${subscriptions.length} subscriptions to bill`);

    for (const sub of subscriptions) {
      try {
        const periodStart = new Date(sub.currentPeriodEnd!);
        const periodEnd = new Date(periodStart);
        periodEnd.setMonth(periodEnd.getMonth() + 1);

        const dueDate = new Date(periodStart);
        dueDate.setDate(dueDate.getDate() + 3);

        const totalAmount = sub.activity.monthlyPriceCents!;
        const platformFee = Math.round(totalAmount * 0.1);
        const leaderAmount = totalAmount - platformFee;

        const billing = await this.prisma.subscriptionBilling.create({
          data: {
            subscriptionId: sub.id,
            leaderId: sub.activity.createdById,
            periodStart,
            periodEnd,
            dueDate,
            totalAmount,
            platformFee,
            leaderAmount,
            status: 'pending',
          },
        });

        // Generate MP preference
        const webhookUrl =
          this.config.get<string>('mercadopago_webhook_url') ||
          'https://localhost:3000/api/webhooks/mercadopago';

        const preference = await this.mp.createPreference(
          [
            {
              id: sub.activityId,
              title: `Suscripción mensual: ${sub.activity.title}`,
              quantity: 1,
              unit_price: totalAmount,
            },
          ],
          `sub_${billing.id}`,
          webhookUrl,
          {
            success: 'https://biktus.app/subscription/success',
            failure: 'https://biktus.app/subscription/failure',
            pending: 'https://biktus.app/subscription/pending',
          },
        );

        await this.prisma.subscriptionBilling.update({
          where: { id: billing.id },
          data: { mpPreferenceId: preference.id, notifiedAt: now },
        });

        // Update subscription periods and status
        await this.prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: 'pending_payment',
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
          },
        });

        // Notify user
        await this.notifications.create(
          sub.userId,
          'subscription_payment_due',
          'Pago de suscripción pendiente',
          `Tu suscripción a "${sub.activity.title}" requiere pago. Haz clic para pagar.`,
          {
            subscriptionId: sub.id,
            billingId: billing.id,
            initPoint: preference.init_point,
          },
        );

        this.logger.log(`Billing generated for subscription ${sub.id}`);
      } catch (err) {
        this.logger.error(
          `Failed to generate billing for subscription ${sub.id}`,
          err,
        );
      }
    }
  }

  @Cron('0 10 * * *', { timeZone: 'America/Santiago' })
  async checkOverduePayments() {
    this.logger.log('Checking overdue payments...');
    const now = new Date();

    const overdueBillings = await this.prisma.subscriptionBilling.findMany({
      where: {
        status: 'pending',
        dueDate: { lt: now },
      },
      include: {
        subscription: { include: { activity: true } },
      },
    });

    this.logger.log(`Found ${overdueBillings.length} overdue billings`);

    for (const billing of overdueBillings) {
      try {
        // Only mark overdue if subscription isn't already overdue or cancelled
        if (
          billing.subscription.status !== 'overdue' &&
          billing.subscription.status !== 'cancelled'
        ) {
          await this.prisma.subscription.update({
            where: { id: billing.subscriptionId },
            data: { status: 'overdue' },
          });

          await this.notifications.create(
            billing.subscription.userId,
            'subscription_overdue',
            'Suscripción vencida',
            `Tu suscripción a "${billing.subscription.activity.title}" está vencida. Paga para continuar participando.`,
            {
              subscriptionId: billing.subscriptionId,
              billingId: billing.id,
            },
          );
        }
      } catch (err) {
        this.logger.error(
          `Failed to process overdue billing ${billing.id}`,
          err,
        );
      }
    }
  }

  async handleSubscriptionPayment(
    billingId: string,
    mpPaymentId: string,
    mpStatus: string,
  ) {
    const billing = await this.prisma.subscriptionBilling.findUnique({
      where: { id: billingId },
      include: {
        subscription: { include: { activity: true } },
      },
    });

    if (!billing) {
      this.logger.warn(`Subscription billing not found: ${billingId}`);
      return;
    }

    // Idempotency
    if (billing.status === 'paid') return;

    if (mpStatus === 'approved') {
      await this.prisma.$transaction([
        this.prisma.subscriptionBilling.update({
          where: { id: billingId },
          data: {
            status: 'paid',
            mpPaymentId,
            mpStatus,
            paidAt: new Date(),
          },
        }),
        this.prisma.subscription.update({
          where: { id: billing.subscriptionId },
          data: { status: 'active' },
        }),
      ]);

      await this.notifications.create(
        billing.subscription.userId,
        'subscription_payment_confirmed',
        'Pago de suscripción confirmado',
        `Tu pago de $${billing.totalAmount} para "${billing.subscription.activity.title}" fue confirmado.`,
        { billingId, subscriptionId: billing.subscriptionId },
      );

      // Notify leader
      await this.notifications.create(
        billing.leaderId,
        'payment_received',
        'Pago de suscripción recibido',
        `Se recibió un pago de suscripción para "${billing.subscription.activity.title}".`,
        { billingId, subscriptionId: billing.subscriptionId },
      );
    } else if (mpStatus === 'rejected' || mpStatus === 'cancelled') {
      await this.prisma.subscriptionBilling.update({
        where: { id: billingId },
        data: { status: 'failed', mpPaymentId, mpStatus },
      });

      await this.notifications.create(
        billing.subscription.userId,
        'subscription_payment_due',
        'Pago fallido',
        'Tu pago de suscripción no pudo ser procesado. Por favor intenta nuevamente.',
        { billingId, subscriptionId: billing.subscriptionId },
      );
    }
  }

  getPendingTransfers() {
    return this.prisma.subscriptionBilling.findMany({
      where: { status: 'paid', transferStatus: 'pending' },
      orderBy: { paidAt: 'desc' },
      include: {
        leader: {
          select: {
            id: true,
            email: true,
            profile: { select: { firstName: true, lastName: true } },
            bankInfo: true,
          },
        },
        subscription: {
          include: {
            activity: { select: { id: true, title: true } },
            user: {
              select: {
                id: true,
                email: true,
                profile: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });
  }

  async markTransferred(
    billingId: string,
    adminId: string,
    notes?: string,
  ) {
    const billing = await this.prisma.subscriptionBilling.findUnique({
      where: { id: billingId },
      include: { subscription: { include: { activity: true } } },
    });

    if (!billing) throw new NotFoundException('Billing not found');
    if (billing.status !== 'paid') {
      throw new NotFoundException('Billing not paid');
    }
    if (billing.transferStatus !== 'pending') {
      throw new NotFoundException('Billing already transferred or cancelled');
    }

    const updated = await this.prisma.subscriptionBilling.update({
      where: { id: billingId },
      data: {
        transferStatus: 'transferred',
        transferredAt: new Date(),
        transferredBy: adminId,
        transferNotes: notes,
      },
    });

    await this.notifications.create(
      billing.leaderId,
      'transfer_completed',
      'Transferencia realizada',
      `Se transfirió $${billing.leaderAmount} por suscripción a "${billing.subscription.activity.title}".`,
      { billingId },
    );

    return updated;
  }
}
