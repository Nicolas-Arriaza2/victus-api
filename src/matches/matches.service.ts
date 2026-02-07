import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MatchesService {
  constructor(private prisma: PrismaService) {}

  getMyMatches(userId: string) {
    return this.prisma.match.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      include: {
        userA: {
          select: {
            id: true,
            username: true,
            profile: {
              select: { firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
        userB: {
          select: {
            id: true,
            username: true,
            profile: {
              select: { firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
        session: {
          include: { activity: { select: { id: true, title: true, type: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  getSessionMatches(userId: string, sessionId: string) {
    return this.prisma.match.findMany({
      where: {
        sessionId,
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      include: {
        userA: {
          select: {
            id: true,
            username: true,
            profile: {
              select: { firstName: true, lastName: true, avatarUrl: true },
            },
          },
        },
        userB: {
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
