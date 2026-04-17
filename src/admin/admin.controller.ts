import {
  Controller,
  Post,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEMO_USERS: Array<{
  email: string;
  photos: string[];
}> = [
  {
    email: 'lider@biktus.local',
    photos: [
      'https://randomuser.me/api/portraits/women/10.jpg',
      'https://randomuser.me/api/portraits/women/11.jpg',
      'https://randomuser.me/api/portraits/women/12.jpg',
    ],
  },
  {
    email: 'ana@biktus.local',
    photos: [
      'https://randomuser.me/api/portraits/women/20.jpg',
      'https://randomuser.me/api/portraits/women/21.jpg',
      'https://randomuser.me/api/portraits/women/22.jpg',
    ],
  },
  {
    email: 'bruno@biktus.local',
    photos: [
      'https://randomuser.me/api/portraits/men/20.jpg',
      'https://randomuser.me/api/portraits/men/21.jpg',
    ],
  },
  {
    email: 'diego@biktus.local',
    photos: [
      'https://randomuser.me/api/portraits/men/30.jpg',
      'https://randomuser.me/api/portraits/men/31.jpg',
      'https://randomuser.me/api/portraits/men/32.jpg',
    ],
  },
  {
    email: 'fernanda@biktus.local',
    photos: [
      'https://randomuser.me/api/portraits/women/30.jpg',
      'https://randomuser.me/api/portraits/women/31.jpg',
      'https://randomuser.me/api/portraits/women/32.jpg',
    ],
  },
  {
    email: 'gabriel@biktus.local',
    photos: [
      'https://randomuser.me/api/portraits/men/40.jpg',
      'https://randomuser.me/api/portraits/men/41.jpg',
    ],
  },
  {
    email: 'isabela@biktus.local',
    photos: [
      'https://randomuser.me/api/portraits/women/40.jpg',
      'https://randomuser.me/api/portraits/women/41.jpg',
      'https://randomuser.me/api/portraits/women/42.jpg',
    ],
  },
  {
    email: 'camila@biktus.local',
    photos: [
      'https://randomuser.me/api/portraits/women/50.jpg',
      'https://randomuser.me/api/portraits/women/51.jpg',
    ],
  },
  {
    email: 'rodrigo@biktus.local',
    photos: [
      'https://randomuser.me/api/portraits/men/50.jpg',
      'https://randomuser.me/api/portraits/men/51.jpg',
    ],
  },
  {
    email: 'sofia@biktus.local',
    photos: [
      'https://randomuser.me/api/portraits/women/60.jpg',
      'https://randomuser.me/api/portraits/women/61.jpg',
    ],
  },
  {
    email: 'mateo@biktus.local',
    photos: [
      'https://randomuser.me/api/portraits/men/60.jpg',
      'https://randomuser.me/api/portraits/men/61.jpg',
    ],
  },
  {
    email: 'lucia@biktus.local',
    photos: [
      'https://randomuser.me/api/portraits/women/70.jpg',
      'https://randomuser.me/api/portraits/women/71.jpg',
    ],
  },
];

@Controller('admin')
export class AdminController {
  constructor(private prisma: PrismaService) {}

  @Post('seed-photos')
  async seedPhotos(@Headers('x-admin-secret') secret: string) {
    if (secret !== 'biktus-demo-2026') {
      throw new UnauthorizedException('Invalid secret');
    }

    const results: Record<string, string> = {};

    for (const { email, photos } of DEMO_USERS) {
      const user = await this.prisma.user.findUnique({ where: { email } });
      if (!user) {
        results[email] = 'not found — skipped';
        continue;
      }

      // Remove existing demo photos
      await this.prisma.userPhoto.deleteMany({ where: { userId: user.id } });

      // Insert new photos
      for (let i = 0; i < photos.length; i++) {
        await this.prisma.userPhoto.create({
          data: {
            userId: user.id,
            url: photos[i],
            position: i,
            format: 'jpg',
          },
        });
      }

      // Set avatarUrl to first photo
      await this.prisma.userProfile.update({
        where: { userId: user.id },
        data: { avatarUrl: photos[0] },
      });

      results[email] = `${photos.length} photos added`;
    }

    return { ok: true, results };
  }
}
