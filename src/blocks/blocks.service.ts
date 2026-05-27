import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BlocksService {
  constructor(private prisma: PrismaService) {}

  async block(blockerId: string, blockedId: string) {
    return this.prisma.userBlock.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      create: { blockerId, blockedId },
      update: {},
    });
  }

  async unblock(blockerId: string, blockedId: string) {
    await this.prisma.userBlock.deleteMany({ where: { blockerId, blockedId } });
  }

  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const b = await this.prisma.userBlock.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
    return !!b;
  }

  async myBlockedIds(blockerId: string): Promise<string[]> {
    const blocks = await this.prisma.userBlock.findMany({
      where: { blockerId },
      select: { blockedId: true },
    });
    return blocks.map((b) => b.blockedId);
  }
}
