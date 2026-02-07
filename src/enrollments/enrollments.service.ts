import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  async enroll(userId: string, sessionId: string) {
    const session = await this.prisma.activitySession.findUnique({
      where: { id: sessionId },
      include: { _count: { select: { enrollments: true } } },
    });
    if (!session) throw new NotFoundException('Session not found');

    if (session.capacity && session._count.enrollments >= session.capacity) {
      throw new BadRequestException('Session is full');
    }

    const existing = await this.prisma.activityEnrollment.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
    });
    if (existing) throw new ConflictException('Already enrolled');

    return this.prisma.activityEnrollment.create({
      data: { sessionId, userId, status: 'confirmed' },
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
}
