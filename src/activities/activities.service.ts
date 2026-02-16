import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  findAll(filters?: { type?: string; interestId?: string }) {
    return this.prisma.activity.findMany({
      where: {
        isActive: true,
        ...(filters?.type && { type: filters.type as any }),
        ...(filters?.interestId && {
          interests: { some: { interestId: filters.interestId } },
        }),
      },
      include: {
        sessions: { where: { startsAt: { gte: new Date() } }, orderBy: { startsAt: 'asc' } },
        interests: { include: { interest: true } },
        createdBy: { select: { id: true, username: true, profile: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        sessions: { orderBy: { startsAt: 'asc' } },
        interests: { include: { interest: true } },
        createdBy: { select: { id: true, username: true, profile: { select: { firstName: true, lastName: true } } } },
      },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    return activity;
  }

  async create(createdById: string, dto: CreateActivityDto) {
    if (
      dto.pricingModel === 'monthly_subscription' &&
      (!dto.monthlyPriceCents || dto.monthlyPriceCents <= 0)
    ) {
      throw new BadRequestException(
        'monthlyPriceCents is required and must be > 0 for monthly subscriptions',
      );
    }

    const { interestIds, ...data } = dto;
    return this.prisma.activity.create({
      data: {
        ...data,
        createdById,
        ...(interestIds?.length && {
          interests: {
            create: interestIds.map((interestId) => ({ interestId })),
          },
        }),
      },
      include: { interests: { include: { interest: true } } },
    });
  }

  async update(id: string, userId: string, dto: UpdateActivityDto) {
    const activity = await this.prisma.activity.findUnique({ where: { id } });
    if (!activity) throw new NotFoundException('Activity not found');
    if (activity.createdById !== userId)
      throw new ForbiddenException('Not your activity');

    if (
      dto.pricingModel === 'monthly_subscription' &&
      (!dto.monthlyPriceCents || dto.monthlyPriceCents <= 0)
    ) {
      throw new BadRequestException(
        'monthlyPriceCents is required and must be > 0 for monthly subscriptions',
      );
    }

    const { interestIds, ...data } = dto;

    if (interestIds) {
      await this.prisma.activityInterest.deleteMany({
        where: { activityId: id },
      });
      if (interestIds.length > 0) {
        await this.prisma.activityInterest.createMany({
          data: interestIds.map((interestId) => ({
            activityId: id,
            interestId,
          })),
        });
      }
    }

    return this.prisma.activity.update({
      where: { id },
      data,
      include: { interests: { include: { interest: true } } },
    });
  }

  async getMyActivities(userId: string) {
    return this.prisma.activity.findMany({
      where: { createdById: userId },
      include: {
        sessions: {
          include: { _count: { select: { enrollments: true } } },
        },
        interests: { include: { interest: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDashboard(id: string, userId: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        interests: { include: { interest: true } },
        sessions: {
          include: {
            _count: {
              select: { enrollments: true, swipes: true, matches: true },
            },
            enrollments: {
              where: { paymentStatus: 'paid' },
              select: { id: true },
            },
          },
          orderBy: { startsAt: 'asc' },
        },
      },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    if (activity.createdById !== userId)
      throw new ForbiddenException('Not your activity');

    let totalEnrollmentsAllSessions = 0;
    let totalMatchesAllSessions = 0;
    let totalRevenueCents = 0;

    const sessions = await Promise.all(
      activity.sessions.map(async (s) => {
        const revenueCents = s.priceCents
          ? s.priceCents * s.enrollments.length
          : 0;

        totalEnrollmentsAllSessions += s._count.enrollments;
        totalMatchesAllSessions += s._count.matches;
        totalRevenueCents += revenueCents;

        return {
          id: s.id,
          startsAt: s.startsAt,
          capacity: s.capacity,
          totalEnrollments: s._count.enrollments,
          totalSwipes: s._count.swipes,
          totalMatches: s._count.matches,
          revenueCents,
        };
      }),
    );

    return {
      id: activity.id,
      title: activity.title,
      type: activity.type,
      interests: activity.interests.map((ai) => ai.interest),
      totalEnrollmentsAllSessions,
      totalMatchesAllSessions,
      totalRevenueCents,
      sessions,
    };
  }
}
