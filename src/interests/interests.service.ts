import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInterestDto } from './dto/create-interest.dto';

@Injectable()
export class InterestsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.interest.findMany({ orderBy: { name: 'asc' } });
  }

  create(dto: CreateInterestDto) {
    return this.prisma.interest.create({ data: dto });
  }
}
