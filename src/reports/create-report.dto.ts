import { ReportTargetType } from '@prisma/client';

export class CreateReportDto {
  targetType: ReportTargetType;
  questionId?: string;
  answerId?: string;
  targetUserId?: string;
  reason: string;
}
