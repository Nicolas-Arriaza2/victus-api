import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpsertBankInfoDto } from './dto/upsert-bank-info.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      where: { status: 'active' },
      select: {
        id: true,
        email: true,
        username: true,
        roles: true,
        status: true,
        createdAt: true,
        profile: true,
        interests: { include: { interest: true } },
      },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        phone: true,
        roles: true,
        status: true,
        createdAt: true,
        profile: true,
        interests: { include: { interest: true } },
        photos: { orderBy: { position: 'asc' } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const { username, ...profileFields } = dto;
    const data: any = { ...profileFields };
    if (dto.birthdate) data.birthdate = new Date(dto.birthdate);

    if (username !== undefined) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { username },
      });
    }

    await this.prisma.userProfile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });

    return this.findById(userId);
  }

  async setInterests(userId: string, interestIds: string[]) {
    await this.prisma.userInterest.deleteMany({ where: { userId } });
    if (interestIds.length > 0) {
      await this.prisma.userInterest.createMany({
        data: interestIds.map((interestId) => ({ userId, interestId })),
      });
    }
    return this.prisma.userInterest.findMany({
      where: { userId },
      include: { interest: true },
    });
  }

  async upsertBankInfo(userId: string, dto: UpsertBankInfoDto) {
    return this.prisma.leaderBankInfo.upsert({
      where: { userId },
      update: { ...dto },
      create: { userId, ...dto },
    });
  }

  async getBankInfo(userId: string) {
    const info = await this.prisma.leaderBankInfo.findUnique({
      where: { userId },
    });
    if (!info) throw new NotFoundException('Bank info not found');
    return info;
  }

  async getLeaderStats(userId: string) {
    const now = new Date();
    const last7  = new Date(now.getTime() - 7  * 24 * 3600 * 1000);
    const last30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

    // ── Activities & Sessions ──────────────────────────────────────────────
    const activities = await this.prisma.activity.findMany({
      where: { createdById: userId },
      include: {
        sessions: { select: { id: true, startsAt: true } },
        enrollments: false,
      },
    });

    const totalActivities = activities.length;
    const totalSessions   = activities.reduce((s, a) => s + a.sessions.length, 0);
    const upcomingSessions = activities.reduce(
      (s, a) => s + a.sessions.filter((ss) => ss.startsAt > now).length,
      0,
    );

    // ── Enrollments ────────────────────────────────────────────────────────
    const sessionIds = activities.flatMap((a) => a.sessions.map((s) => s.id));

    const enrollments = await this.prisma.activityEnrollment.findMany({
      where: { sessionId: { in: sessionIds } },
      select: { status: true, paymentStatus: true, createdAt: true, userId: true },
    });

    const totalEnrollments    = enrollments.length;
    const confirmedEnrollments = enrollments.filter((e) => e.status === 'confirmed').length;
    const pendingEnrollments  = enrollments.filter((e) => e.status === 'pending').length;
    const enrollmentsLast7    = enrollments.filter((e) => e.createdAt >= last7).length;
    const enrollmentsLast30   = enrollments.filter((e) => e.createdAt >= last30).length;
    const uniqueParticipants  = new Set(enrollments.map((e) => e.userId)).size;

    // ── Revenue ────────────────────────────────────────────────────────────
    const payments = await this.prisma.payment.findMany({
      where: { leaderId: userId, status: 'completed' },
      select: { leaderAmount: true, transferStatus: true, paidAt: true },
    });

    const totalRevenue     = payments.reduce((s, p) => s + Number(p.leaderAmount), 0);
    const transferred      = payments
      .filter((p) => p.transferStatus === 'transferred')
      .reduce((s, p) => s + Number(p.leaderAmount), 0);
    const pendingTransfer  = totalRevenue - transferred;
    const revenueLast30    = payments
      .filter((p) => p.paidAt && p.paidAt >= last30)
      .reduce((s, p) => s + Number(p.leaderAmount), 0);

    // ── Social (matches inside leader's sessions) ──────────────────────────
    const matchesInSessions = await this.prisma.match.count({
      where: { sessionId: { in: sessionIds } },
    });

    // ── Top activities by enrollment count ────────────────────────────────
    const activityEnrollmentCounts = await Promise.all(
      activities.map(async (a) => {
        const actSessIds = a.sessions.map((s) => s.id);
        const count = await this.prisma.activityEnrollment.count({
          where: { sessionId: { in: actSessIds } },
        });
        const revenue = await this.prisma.payment.aggregate({
          where: { activityId: a.id, leaderId: userId, status: 'completed' },
          _sum: { leaderAmount: true },
        });
        return {
          id: a.id,
          title: a.title,
          type: a.type,
          enrollmentCount: count,
          revenue: Number(revenue._sum.leaderAmount ?? 0),
        };
      }),
    );

    const topActivities = activityEnrollmentCounts
      .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
      .slice(0, 5);

    return {
      activities: {
        total: totalActivities,
        sessions: totalSessions,
        upcoming: upcomingSessions,
      },
      enrollments: {
        total: totalEnrollments,
        confirmed: confirmedEnrollments,
        pending: pendingEnrollments,
        last7days: enrollmentsLast7,
        last30days: enrollmentsLast30,
        uniqueParticipants,
      },
      revenue: {
        total: totalRevenue,
        pending: pendingTransfer,
        transferred,
        last30days: revenueLast30,
      },
      social: {
        matchesInSessions,
      },
      topActivities,
    };
  }
}
