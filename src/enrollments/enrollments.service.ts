import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class EnrollmentsService {
  constructor(
    private prisma: PrismaService,
    private subscriptions: SubscriptionsService,
    private notifications: NotificationsService,
  ) {}

  async enroll(userId: string, sessionId: string) {
    const session = await this.prisma.activitySession.findUnique({
      where: { id: sessionId },
      include: {
        activity: true,
        _count: { select: { enrollments: true } },
      },
    });
    if (!session) throw new NotFoundException('Session not found');

    if (session.capacity && session._count.enrollments >= session.capacity) {
      throw new BadRequestException('Session is full');
    }

    const existing = await this.prisma.activityEnrollment.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
    });
    if (existing) throw new ConflictException('Already enrolled');

    // Monthly subscription activities: verify active subscription
    if (session.activity.pricingModel === 'monthly_subscription') {
      await this.subscriptions.verifyActiveSubscription(
        userId,
        session.activityId,
      );
      return this.prisma.activityEnrollment.create({
        data: {
          sessionId,
          userId,
          status: 'confirmed',
          paymentStatus: 'free', // paid via subscription
        },
        include: { session: { include: { activity: true } } },
      });
    }

    const isPaid = session.priceCents && session.priceCents > 0;

    return this.prisma.activityEnrollment.create({
      data: {
        sessionId,
        userId,
        status: isPaid ? 'pending' : 'confirmed',
        paymentStatus: isPaid ? 'pending_payment' : 'free',
      },
      include: { session: { include: { activity: true } } },
    });
  }

  async cancel(userId: string, enrollmentId: string) {
    const enrollment = await this.prisma.activityEnrollment.findUnique({
      where: { id: enrollmentId },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    if (enrollment.userId !== userId)
      throw new BadRequestException('Not your enrollment');

    return this.prisma.activityEnrollment.update({
      where: { id: enrollmentId },
      data: { status: 'cancelled' },
    });
  }

  getMyEnrollments(userId: string) {
    return this.prisma.activityEnrollment.findMany({
      where: { userId, status: { not: 'cancelled' } },
      include: { session: { include: { activity: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  getSessionEnrollments(sessionId: string) {
    return this.prisma.activityEnrollment.findMany({
      where: { sessionId, status: { not: 'cancelled' } },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: {
              select: { firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
      },
    });
  }

  async markPaymentStatus(
    enrollmentId: string,
    leaderId: string,
    paid: boolean,
  ) {
    const enrollment = await this.prisma.activityEnrollment.findUnique({
      where: { id: enrollmentId },
      include: { session: { include: { activity: true } } },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    if (enrollment.session.activity.createdById !== leaderId)
      throw new ForbiddenException('Not your activity');

    const updated = await this.prisma.activityEnrollment.update({
      where: { id: enrollmentId },
      data: {
        paymentStatus: paid ? 'paid' : 'pending_payment',
        status: paid ? 'confirmed' : enrollment.status,
      },
      include: {
        user: { select: { id: true, username: true, profile: { select: { firstName: true } } } },
      },
    });

    if (paid) {
      await this.notifications.create(
        enrollment.userId,
        'payment_confirmed',
        'Pago confirmado',
        `Tu pago para ${enrollment.session.activity.title} fue confirmado.`,
        { enrollmentId, activityId: enrollment.session.activityId },
      );
    }

    return updated;
  }

  async updateStatusByLeader(
    enrollmentId: string,
    leaderId: string,
    status: 'confirmed' | 'attended',
  ) {
    const enrollment = await this.prisma.activityEnrollment.findUnique({
      where: { id: enrollmentId },
      include: { session: { include: { activity: true } } },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    if (enrollment.session.activity.createdById !== leaderId)
      throw new ForbiddenException('Not your activity');

    return this.prisma.activityEnrollment.update({
      where: { id: enrollmentId },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });
  }
}
