import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../auth/email.service';
import { CreateReportDto } from './create-report.dto';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private prisma: PrismaService,
    private email: EmailService,
  ) {}

  async create(reporterId: string, dto: CreateReportDto) {
    const report = await this.prisma.contentReport.create({
      data: {
        reporterId,
        targetType: dto.targetType,
        questionId:   dto.questionId   ?? null,
        answerId:     dto.answerId     ?? null,
        targetUserId: dto.targetUserId ?? null,
        reason: dto.reason,
      },
    });

    // Notify developer by email (fire-and-forget)
    this.email.sendReportAlert(reporterId, dto).catch((err) =>
      this.logger.error('Error enviando email de reporte', err),
    );

    return report;
  }
}
