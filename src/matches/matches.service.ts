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
            id: true, username: true,
            profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
          },
        },
        userB: {
          select: {
            id: true, username: true,
            profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
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
      where: { sessionId, OR: [{ userAId: userId }, { userBId: userId }] },
      include: {
        userA: {
          select: {
            id: true, username: true,
            profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
          },
        },
        userB: {
          select: {
            id: true, username: true,
            profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
          },
        },
      },
    });
  }

  async getCompatibilityStats(userId: string) {
    // Get all my matches
    const matches = await this.prisma.match.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
    });

    const matchedUserIds = matches.map((m) =>
      m.userAId === userId ? m.userBId : m.userAId,
    );

    if (matchedUserIds.length === 0) {
      return { totalMatches: 0, topInterests: [], topActivities: [] };
    }

    // Type 1: interests of matched users
    const interestRows = await this.prisma.userInterest.findMany({
      where: { userId: { in: matchedUserIds } },
      include: { interest: true },
    });

    const interestCount: Record<string, { name: string; count: number }> = {};
    for (const row of interestRows) {
      const key = row.interest.slug;
      if (!interestCount[key]) {
        interestCount[key] = { name: row.interest.name, count: 0 };
      }
      interestCount[key].count++;
    }
    const topInterests = Object.values(interestCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Type 2: activities matched users are enrolled in
    const enrollments = await this.prisma.activityEnrollment.findMany({
      where: {
        userId: { in: matchedUserIds },
        status: { not: 'cancelled' },
      },
      include: {
        session: {
          include: { activity: { select: { id: true, title: true, type: true } } },
        },
      },
    });

    const activityCount: Record<string, { id: string; title: string; type: string; count: number }> = {};
    for (const e of enrollments) {
      const act = e.session.activity;
      if (!activityCount[act.id]) {
        activityCount[act.id] = { id: act.id, title: act.title, type: act.type, count: 0 };
      }
      activityCount[act.id].count++;
    }
    const topActivities = Object.values(activityCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return { totalMatches: matchedUserIds.length, topInterests, topActivities };
  }
}
