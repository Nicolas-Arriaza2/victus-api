import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateSessionDto) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: dto.activityId },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    if (activity.createdById !== userId)
      throw new ForbiddenException('Not your activity');

    return this.prisma.activitySession.create({
      data: {
        activityId: dto.activityId,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        capacity: dto.capacity,
        priceCents: dto.priceCents,
        locationName: dto.locationName,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
    });
  }

  async findByActivity(activityId: string) {
    return this.prisma.activitySession.findMany({
      where: { activityId },
      include: {
        _count: { select: { enrollments: true } },
      },
      orderBy: { startsAt: 'asc' },
    });
  }

  async findById(id: string) {
    const session = await this.prisma.activitySession.findUnique({
      where: { id },
      include: {
        activity: true,
        enrollments: {
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
        },
        _count: { select: { enrollments: true } },
      },
    });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  async update(id: string, userId: string, dto: UpdateSessionDto) {
    const session = await this.prisma.activitySession.findUnique({
      where: { id },
      include: { activity: true },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.activity.createdById !== userId)
      throw new ForbiddenException('Not your session');

    return this.prisma.activitySession.update({
      where: { id },
      data: {
        ...(dto.startsAt && { startsAt: new Date(dto.startsAt) }),
        ...(dto.endsAt && { endsAt: new Date(dto.endsAt) }),
        ...(dto.capacity !== undefined && { capacity: dto.capacity }),
        ...(dto.priceCents !== undefined && { priceCents: dto.priceCents }),
        ...(dto.locationName !== undefined && { locationName: dto.locationName }),
        ...(dto.latitude !== undefined && { latitude: dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
      },
    });
  }

  async getStats(id: string, userId: string) {
    const session = await this.prisma.activitySession.findUnique({
      where: { id },
      include: { activity: true },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.activity.createdById !== userId)
      throw new ForbiddenException('Not your session');

    const enrollments = await this.prisma.activityEnrollment.groupBy({
      by: ['status'],
      where: { sessionId: id, status: { not: 'cancelled' } },
      _count: true,
    });

    const swipes = await this.prisma.swipeEvent.groupBy({
      by: ['action'],
      where: { sessionId: id },
      _count: true,
    });

    const totalMatches = await this.prisma.match.count({
      where: { sessionId: id },
    });

    const totalEnrollments = enrollments.reduce((sum, e) => sum + e._count, 0);
    const enrollmentsByStatus: Record<string, number> = {};
    enrollments.forEach((e) => {
      enrollmentsByStatus[e.status] = e._count;
    });

    const totalLikes = swipes.find((s) => s.action === 'LIKE')?._count ?? 0;
    const totalPasses = swipes.find((s) => s.action === 'PASS')?._count ?? 0;

    return {
      sessionId: id,
      activityTitle: session.activity.title,
      capacity: session.capacity,
      spotsLeft: session.capacity ? session.capacity - totalEnrollments : null,
      totalEnrollments,
      enrollmentsByStatus,
      totalLikes,
      totalPasses,
      totalMatches,
      startsAt: session.startsAt,
      endsAt: session.endsAt,
    };
  }
}
