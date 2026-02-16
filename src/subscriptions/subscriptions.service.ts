import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MercadoPagoService } from '../payments/mercadopago.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private prisma: PrismaService,
    private mp: MercadoPagoService,
    private notifications: NotificationsService,
    private config: ConfigService,
  ) {}

  async subscribe(userId: string, activityId: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: { createdBy: { select: { id: true, profile: { select: { firstName: true } } } } },
    });
    if (!activity) throw new NotFoundException('Activity not found');

    if (activity.pricingModel !== 'monthly_subscription') {
      throw new BadRequestException(
        'This activity does not use monthly subscriptions',
      );
    }

    if (!activity.monthlyPriceCents || activity.monthlyPriceCents <= 0) {
      throw new BadRequestException('Activity has no monthly price configured');
    }

    const existing = await this.prisma.subscription.findUnique({
      where: { userId_activityId: { userId, activityId } },
    });
    if (existing && existing.status !== 'cancelled') {
      throw new BadRequestException('You already have an active subscription');
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 3);

    const totalAmount = activity.monthlyPriceCents;
    const platformFee = Math.round(totalAmount * 0.1);
    const leaderAmount = totalAmount - platformFee;

    // If cancelled subscription exists, reactivate it
    let subscription;
    if (existing && existing.status === 'cancelled') {
      subscription = await this.prisma.subscription.update({
        where: { id: existing.id },
        data: {
          status: 'pending_payment',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelledAt: null,
        },
      });
    } else {
      subscription = await this.prisma.subscription.create({
        data: {
          userId,
          activityId,
          status: 'pending_payment',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });
    }

    const billing = await this.prisma.subscriptionBilling.create({
      data: {
        subscriptionId: subscription.id,
        leaderId: activity.createdById,
        periodStart: now,
        periodEnd,
        dueDate,
        totalAmount,
        platformFee,
        leaderAmount,
        status: 'pending',
      },
    });

    const webhookUrl =
      this.config.get<string>('mercadopago_webhook_url') ||
      'https://localhost:3000/api/webhooks/mercadopago';

    const preference = await this.mp.createPreference(
      [
        {
          id: activityId,
          title: `Suscripción mensual: ${activity.title}`,
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
      data: { mpPreferenceId: preference.id },
    });

    // Notify leader about new subscriber
    await this.notifications.create(
      activity.createdById,
      'new_subscriber',
      'Nuevo suscriptor',
      `Un usuario se suscribió a "${activity.title}".`,
      { subscriptionId: subscription.id, activityId },
    );

    return { subscription, initPoint: preference.init_point };
  }

  getMySubscriptions(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId, status: { not: 'cancelled' } },
      include: {
        activity: {
          select: { id: true, title: true, type: true, monthlyPriceCents: true },
        },
        billings: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSubscriptionDetail(userId: string, subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        activity: {
          select: { id: true, title: true, type: true, monthlyPriceCents: true },
        },
        billings: { orderBy: { periodStart: 'desc' } },
      },
    });

    if (!subscription) throw new NotFoundException('Subscription not found');
    if (subscription.userId !== userId) {
      throw new BadRequestException('Not your subscription');
    }

    return subscription;
  }

  async payCurrentBilling(userId: string, subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        activity: true,
        billings: {
          where: { status: 'pending' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!subscription) throw new NotFoundException('Subscription not found');
    if (subscription.userId !== userId) {
      throw new BadRequestException('Not your subscription');
    }

    const billing = subscription.billings[0];
    if (!billing) {
      throw new BadRequestException('No pending billing found');
    }

    const webhookUrl =
      this.config.get<string>('mercadopago_webhook_url') ||
      'https://localhost:3000/api/webhooks/mercadopago';

    const preference = await this.mp.createPreference(
      [
        {
          id: subscription.activityId,
          title: `Suscripción mensual: ${subscription.activity.title}`,
          quantity: 1,
          unit_price: Number(billing.totalAmount),
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
      data: { mpPreferenceId: preference.id },
    });

    return { billingId: billing.id, initPoint: preference.init_point };
  }

  async cancelSubscription(userId: string, subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { activity: true },
    });

    if (!subscription) throw new NotFoundException('Subscription not found');
    if (subscription.userId !== userId) {
      throw new BadRequestException('Not your subscription');
    }
    if (subscription.status === 'cancelled') {
      throw new BadRequestException('Subscription already cancelled');
    }

    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: 'cancelled', cancelledAt: new Date() },
    });

    // Cancel pending billings
    await this.prisma.subscriptionBilling.updateMany({
      where: { subscriptionId, status: 'pending' },
      data: { status: 'cancelled' },
    });

    await this.notifications.create(
      userId,
      'subscription_cancelled',
      'Suscripción cancelada',
      `Tu suscripción a "${subscription.activity.title}" ha sido cancelada.`,
      { subscriptionId },
    );

    return updated;
  }

  async verifyActiveSubscription(userId: string, activityId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId_activityId: { userId, activityId } },
    });

    if (!subscription || subscription.status !== 'active') {
      throw new BadRequestException(
        'Debes tener una suscripción activa para participar en esta actividad',
      );
    }

    return subscription;
  }

  async getActivitySubscribers(activityId: string, leaderId: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    if (activity.createdById !== leaderId) {
      throw new BadRequestException('Not your activity');
    }

    return this.prisma.subscription.findMany({
      where: { activityId, status: { not: 'cancelled' } },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            profile: {
              select: { firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
        billings: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }
}
