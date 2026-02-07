import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

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
        role: true,
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
        role: true,
        status: true,
        createdAt: true,
        profile: true,
        interests: { include: { interest: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data: any = { ...dto };
    if (dto.birthdate) data.birthdate = new Date(dto.birthdate);

    return this.prisma.userProfile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
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
}
