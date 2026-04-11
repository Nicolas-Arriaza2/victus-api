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
}
