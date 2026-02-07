import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';

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
}
