import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSwipeDto } from './dto/create-swipe.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class SwipesService {
  constructor(
    private prisma: PrismaService,
    private subscriptions: SubscriptionsService,
  ) {}

  async swipe(byUserId: string, dto: CreateSwipeDto) {
    if (byUserId === dto.toUserId)
      throw new BadRequestException('Cannot swipe yourself');

    // Check subscription access for monthly activities
    const session = await this.prisma.activitySession.findUnique({
      where: { id: dto.sessionId },
      include: { activity: true },
    });
    if (session?.activity.pricingModel === 'monthly_subscription') {
      await this.subscriptions.verifyActiveSubscription(
        byUserId,
        session.activityId,
      );
    }

    // Verify both users are enrolled in the session
    const enrollments = await this.prisma.activityEnrollment.findMany({
      where: {
        sessionId: dto.sessionId,
        userId: { in: [byUserId, dto.toUserId] },
        status: { not: 'cancelled' },
      },
    });
    if (enrollments.length < 2)
      throw new BadRequestException(
        'Both users must be enrolled in the session',
      );

    // Upsert the swipe (allows changing from PASS to LIKE)
    const swipe = await this.prisma.swipeEvent.upsert({
      where: {
        byUserId_toUserId_sessionId: {
          byUserId,
          toUserId: dto.toUserId,
          sessionId: dto.sessionId,
        },
      },
      update: { action: dto.action },
      create: {
        byUserId,
        toUserId: dto.toUserId,
        sessionId: dto.sessionId,
        action: dto.action,
      },
    });

    // Check for mutual like -> create match
    let match: any = null;
    if (dto.action === 'LIKE') {
      const reciprocal = await this.prisma.swipeEvent.findUnique({
        where: {
          byUserId_toUserId_sessionId: {
            byUserId: dto.toUserId,
            toUserId: byUserId,
            sessionId: dto.sessionId,
          },
        },
      });

      if (reciprocal?.action === 'LIKE') {
        // Normalize order: smaller UUID is userA
        const [userAId, userBId] =
          byUserId < dto.toUserId
            ? [byUserId, dto.toUserId]
            : [dto.toUserId, byUserId];

        match = await this.prisma.match.upsert({
          where: {
            userAId_userBId_sessionId: {
              userAId,
              userBId,
              sessionId: dto.sessionId,
            },
          },
          update: {},
          create: { userAId, userBId, sessionId: dto.sessionId },
        });
      }
    }

    return { swipe, match };
  }

  getCandidates(userId: string, sessionId: string) {
    // Return enrolled users in this session that the current user hasn't swiped yet
    return this.prisma.user.findMany({
      where: {
        enrollments: {
          some: { sessionId, status: { not: 'cancelled' } },
        },
        id: { not: userId },
        NOT: {
          swipesReceived: {
            some: { byUserId: userId, sessionId },
          },
        },
      },
      select: {
        id: true,
        username: true,
        profile: true,
        interests: { include: { interest: true } },
      },
    });
  }

  whoLikedMe(userId: string, sessionId: string) {
    return this.prisma.swipeEvent.findMany({
      where: { toUserId: userId, sessionId, action: 'LIKE' },
      include: {
        byUser: {
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
