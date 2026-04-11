import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSwipeDto } from './dto/create-swipe.dto';

// ─── Haversine distance (km) ──────────────────────────────────────────────────
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function ageFromBirthdate(birthdate: Date): number {
  const now = new Date();
  let age = now.getFullYear() - birthdate.getFullYear();
  const m = now.getMonth() - birthdate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthdate.getDate())) age--;
  return age;
}

export interface DiscoverFilters {
  lat?: number;
  lng?: number;
  maxDistance?: number;
  minAge?: number;
  maxAge?: number;
  gender?: string;
}

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
        sessionId: dto.sessionId ?? null,
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
          sessionId: dto.sessionId ?? null,
        },
      });

      if (reciprocal?.action === 'LIKE') {
        const [userAId, userBId] =
          byUserId < dto.toUserId
            ? [byUserId, dto.toUserId]
            : [dto.toUserId, byUserId];

        const existingMatch = await this.prisma.match.findFirst({
          where: { userAId, userBId, sessionId: dto.sessionId ?? null },
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

  // ─── Tinder-like global discover with filters ─────────────────────────────
  async getDiscoverCandidates(userId: string, filters: DiscoverFilters = {}) {
    const { lat, lng, maxDistance = 50, minAge, maxAge, gender } = filters;

    // Get my interests for scoring
    const me = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { interests: true },
    });
    const myInterestIds = new Set(me?.interests.map((i) => i.interestId) ?? []);

    // Fetch broad candidate pool (exclude already-swiped users)
    const candidates = await this.prisma.user.findMany({
      where: {
        id: { not: userId },
        status: 'active',
        NOT: {
          swipesReceived: { some: { byUserId: userId } },
        },
      },
      select: {
        id: true,
        username: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
            bio: true,
            city: true,
            latitude: true,
            longitude: true,
            birthdate: true,
            gender: true,
          },
        },
        interests: { include: { interest: true } },
        photos: { orderBy: { position: 'asc' }, take: 3 },
      },
      take: 300,
    });

    // In-memory filter + score (Haversine + age + gender)
    const scored = candidates
      .filter((c) => {
        const p = c.profile;

        // Gender filter
        if (gender && gender !== 'all' && p?.gender !== gender) return false;

        // Age filter
        if (p?.birthdate && (minAge || maxAge)) {
          const age = ageFromBirthdate(new Date(p.birthdate));
          if (minAge && age < minAge) return false;
          if (maxAge && age > maxAge) return false;
        }

        // Distance filter (Haversine)
        if (lat !== undefined && lng !== undefined && maxDistance) {
          if (p?.latitude && p?.longitude) {
            const dist = haversineKm(lat, lng, p.latitude, p.longitude);
            if (dist > maxDistance) return false;
          }
        }

        return true;
      })
      .map((c) => {
        const sharedInterests = c.interests.filter((ui) =>
          myInterestIds.has(ui.interestId),
        ).length;
        const distance =
          lat !== undefined && lng !== undefined && c.profile?.latitude && c.profile?.longitude
            ? Math.round(haversineKm(lat, lng, c.profile.latitude, c.profile.longitude))
            : null;
        return { ...c, _score: sharedInterests, _distance: distance };
      })
      // Sort: most shared interests first, then nearest
      .sort((a, b) => {
        if (b._score !== a._score) return b._score - a._score;
        if (a._distance !== null && b._distance !== null) return a._distance - b._distance;
        if (a._distance !== null) return -1;
        if (b._distance !== null) return 1;
        return 0;
      })
      .slice(0, 30)
      .map(({ _score, _distance, ...c }) => ({ ...c, distanceKm: _distance }));

    return scored;
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
