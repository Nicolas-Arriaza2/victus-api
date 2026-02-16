import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MercadoPagoService } from './mercadopago.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SubscriptionsBillingService } from '../subscriptions/subscriptions-billing.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private mp: MercadoPagoService,
    private notifications: NotificationsService,
    private config: ConfigService,
    @Inject(forwardRef(() => SubscriptionsBillingService))
    private subscriptionsBilling: SubscriptionsBillingService,
  ) {}

  async createPreference(userId: string, sessionId: string) {
    const session = await this.prisma.activitySession.findUnique({
      where: { id: sessionId },
      include: { activity: { include: { createdBy: true } } },
    });
    if (!session) throw new NotFoundException('Session not found');

    if (!session.priceCents || session.priceCents <= 0) {
      throw new BadRequestException('Session is free, no payment needed');
    }

    const enrollment = await this.prisma.activityEnrollment.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
    });
    if (!enrollment) {
      throw new BadRequestException('You must enroll first');
    }

    const existingPayment = await this.prisma.payment.findUnique({
      where: { enrollmentId: enrollment.id },
    });
    if (existingPayment && existingPayment.status === 'completed') {
      throw new BadRequestException('Already paid');
    }

    const totalAmount = session.priceCents;
    const platformFee = Math.round(totalAmount * 0.1);
    const leaderAmount = totalAmount - platformFee;

    // Create or update payment record
    let payment;
    if (existingPayment) {
      payment = existingPayment;
    } else {
      payment = await this.prisma.payment.create({
        data: {
          userId,
          activityId: session.activityId,
          enrollmentId: enrollment.id,
          leaderId: session.activity.createdById,
          totalAmount,
          platformFee,
          leaderAmount,
          status: 'pending',
          transferStatus: 'pending',
        },
      });
    }

    // Update enrollment paymentStatus
    await this.prisma.activityEnrollment.update({
      where: { id: enrollment.id },
      data: { paymentStatus: 'pending_payment' },
    });

    const webhookUrl =
      this.config.get<string>('mercadopago_webhook_url') ||
      'https://localhost:3000/api/webhooks/mercadopago';

    const preference = await this.mp.createPreference(
      [
        {
          id: session.activityId,
          title: session.activity.title,
          quantity: 1,
          unit_price: totalAmount,
        },
      ],
      payment.id,
      webhookUrl,
      {
        success: 'https://biktus.app/payment/success',
        failure: 'https://biktus.app/payment/failure',
        pending: 'https://biktus.app/payment/pending',
      },
    );

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { mpPreferenceId: preference.id },
    });

    return {
      preferenceId: preference.id,
      initPoint: preference.init_point,
      paymentId: payment.id,
    };
  }

  async handleWebhook(body: any) {
    if (body.type !== 'payment' || !body.data?.id) {
      return { received: true };
    }

    const mpPaymentId = String(body.data.id);

    let mpPayment: any;
    try {
      mpPayment = await this.mp.getPayment(mpPaymentId);
    } catch (err) {
      this.logger.error(`Failed to fetch MP payment ${mpPaymentId}`, err);
      return { received: true };
    }

    const externalRef = mpPayment.external_reference;
    if (!externalRef) return { received: true };

    // Route subscription payments to billing service
    if (externalRef.startsWith('sub_')) {
      const billingId = externalRef.slice(4);
      await this.subscriptionsBilling.handleSubscriptionPayment(
        billingId,
        mpPaymentId,
        mpPayment.status,
      );
      return { received: true };
    }

    const paymentId = externalRef;

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        enrollment: { include: { session: { include: { activity: true } } } },
      },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for external_reference: ${paymentId}`);
      return { received: true };
    }

    // Idempotency
    if (payment.status === 'completed') return { received: true };

    const mpStatus = mpPayment.status;

    if (mpStatus === 'approved') {
      await this.prisma.$transaction([
        this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'completed',
            mpPaymentId,
            mpStatus,
            paidAt: new Date(),
          },
        }),
        this.prisma.activityEnrollment.update({
          where: { id: payment.enrollmentId },
          data: { paymentStatus: 'paid', status: 'confirmed' },
        }),
      ]);

      const activityTitle = payment.enrollment.session.activity.title;

      await this.notifications.create(
        payment.userId,
        'payment_confirmed',
        'Pago confirmado',
        `Tu pago de $${payment.totalAmount} para "${activityTitle}" fue confirmado.`,
        { paymentId: payment.id },
      );

      await this.notifications.create(
        payment.leaderId,
        'new_enrollment',
        'Nueva inscripción pagada',
        `Un participante se inscribió y pagó para "${activityTitle}".`,
        { paymentId: payment.id, enrollmentId: payment.enrollmentId },
      );
    } else if (mpStatus === 'rejected' || mpStatus === 'cancelled') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'failed', mpPaymentId, mpStatus },
      });

      await this.prisma.activityEnrollment.update({
        where: { id: payment.enrollmentId },
        data: { paymentStatus: 'pending_payment' },
      });

      await this.notifications.create(
        payment.userId,
        'payment_confirmed',
        'Pago fallido',
        'Tu pago no pudo ser procesado. Por favor intenta nuevamente.',
        { paymentId: payment.id },
      );
    }

    return { received: true };
  }

  async getLeaderEarnings(leaderId: string) {
    const payments = await this.prisma.payment.findMany({
      where: { leaderId, status: 'completed' },
      orderBy: { paidAt: 'desc' },
      include: {
        enrollment: { include: { session: { include: { activity: true } } } },
      },
    });

    const totalEarnings = payments.reduce(
      (sum, p) => sum + Number(p.leaderAmount),
      0,
    );
    const pendingTransfer = payments
      .filter((p) => p.transferStatus === 'pending')
      .reduce((sum, p) => sum + Number(p.leaderAmount), 0);
    const transferred = payments
      .filter((p) => p.transferStatus === 'transferred')
      .reduce((sum, p) => sum + Number(p.leaderAmount), 0);

    return { totalEarnings, pendingTransfer, transferred, payments };
  }

  async getPendingTransfers() {
    const payments = await this.prisma.payment.findMany({
      where: { status: 'completed', transferStatus: 'pending' },
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
        enrollment: { include: { session: { include: { activity: true } } } },
      },
    });

    const subscriptionBillings =
      await this.subscriptionsBilling.getPendingTransfers();

    return {
      count: payments.length + subscriptionBillings.length,
      payments,
      subscriptionBillings,
    };
  }

  async getPlatformRevenue() {
    const sessionResult = await this.prisma.payment.aggregate({
      where: { status: 'completed' },
      _sum: { platformFee: true, totalAmount: true },
      _count: true,
    });

    const subResult = await this.prisma.subscriptionBilling.aggregate({
      where: { status: 'paid' },
      _sum: { platformFee: true, totalAmount: true },
      _count: true,
    });

    return {
      totalRevenue:
        (Number(sessionResult._sum.platformFee) || 0) +
        (Number(subResult._sum.platformFee) || 0),
      totalProcessed:
        (Number(sessionResult._sum.totalAmount) || 0) +
        (Number(subResult._sum.totalAmount) || 0),
      paymentCount: sessionResult._count + subResult._count,
      sessionPayments: sessionResult._count,
      subscriptionPayments: subResult._count,
    };
  }

  async markTransferred(paymentId: string, adminId: string, notes?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        enrollment: { include: { session: { include: { activity: true } } } },
      },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== 'completed') {
      throw new BadRequestException('Payment not completed');
    }
    if (payment.transferStatus !== 'pending') {
      throw new BadRequestException('Payment already transferred or cancelled');
    }

    const updated = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        transferStatus: 'transferred',
        transferredAt: new Date(),
        transferredBy: adminId,
        transferNotes: notes,
      },
    });

    await this.notifications.create(
      payment.leaderId,
      'transfer_completed',
      'Transferencia realizada',
      `Se transfirió $${payment.leaderAmount} por "${payment.enrollment.session.activity.title}".`,
      { paymentId: payment.id },
    );

    return updated;
  }

  getTransferSchedule() {
    // Calculate next first Monday of the month
    const now = new Date();
    let date = new Date(now.getFullYear(), now.getMonth(), 1);

    // If we're past the first Monday, go to next month
    while (date.getDay() !== 1) {
      date.setDate(date.getDate() + 1);
    }

    if (date <= now) {
      date = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      while (date.getDay() !== 1) {
        date.setDate(date.getDate() + 1);
      }
    }

    return { nextTransferDate: date.toISOString().split('T')[0] };
  }
}
