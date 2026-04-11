import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSwipeDto } from './dto/create-swipe.dto';

@Injectable()
export class SwipesService {
  constructor(private prisma: PrismaService) {}

  async swipe(byUserId: string, dto: CreateSwipeDto) {
    if (byUserId === dto.toUserId)
      throw new BadRequestException('Cannot swipe yourself');

    if (dto.sessionId) {
      const enrollments = await this.prisma.activityEnrollment.findMany({
        where: {
          sessionId: dto.sessionId,
          userId: { in: [byUserId, dto.toUserId] },
          status: { not: 'cancelled' },
        },
      });
      if (enrollments.length < 2)
        throw new BadRequestException('Both users must be enrolled in the session');
    }

    const existing = await this.prisma.swipeEvent.findFirst({
      where: {
        byUserId,
        toUserId: dto.toUserId,
        sessionId: dto.sessionId ?? undefined,
      },
    });

    if (existing) {
      await this.prisma.swipeEvent.update({
        where: { id: existing.id },
        data: { action: dto.action },
      });
    } else {
      const createData: any = { byUserId, toUserId: dto.toUserId, action: dto.action };
      if (dto.sessionId) createData.sessionId = dto.sessionId;
      await this.prisma.swipeEvent.create({ data: createData });
    }

    // Check for mutual LIKE → create match
    let match: any = null;
    if (dto.action === 'LIKE') {
      const reciprocal = await this.prisma.swipeEvent.findFirst({
        where: {
          byUserId: dto.toUserId,
          toUserId: byUserId,
          sessionId: dto.sessionId ?? undefined,
        },
      });

      if (reciprocal?.action === 'LIKE') {
        const [userAId, userBId] =
          byUserId < dto.toUserId
            ? [byUserId, dto.toUserId]
            : [dto.toUserId, byUserId];

        const existingMatch = await this.prisma.match.findFirst({
          where: {
            userAId,
            userBId,
            sessionId: dto.sessionId ?? undefined,
          },
        });

        if (!existingMatch) {
          const matchData: any = { userAId, userBId };
          if (dto.sessionId) matchData.sessionId = dto.sessionId;
          match = await this.prisma.match.create({ data: matchData });
        } else {
          match = existingMatch;
        }
      }
    }

    return { match };
  }

  // Global discover: users with overlapping interests, not yet swiped
  getDiscoverCandidates(userId: string) {
    return this.prisma.user.findMany({
      where: {
        id: { not: userId },
        status: 'active',
        interests: { some: {} },
        NOT: {
          swipesReceived: {
            some: { byUserId: userId, sessionId: undefined },
          },
        },
      },
      select: {
        id: true,
        username: true,
        profile: {
          select: { firstName: true, lastName: true, avatarUrl: true, bio: true, city: true },
        },
        interests: { include: { interest: true } },
        photos: { orderBy: { position: 'asc' }, take: 3 },
      },
      take: 30,
    });
  }

  getCandidates(userId: string, sessionId: string) {
    return this.prisma.user.findMany({
      where: {
        enrollments: { some: { sessionId, status: { not: 'cancelled' } } },
        id: { not: userId },
        NOT: { swipesReceived: { some: { byUserId: userId, sessionId } } },
      },
      select: {
        id: true,
        username: true,
        profile: true,
        interests: { include: { interest: true } },
        photos: { orderBy: { position: 'asc' }, take: 1 },
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
            profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
          },
        },
      },
    });
  }
}
