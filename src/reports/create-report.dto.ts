import { ReportTargetType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateReportDto {
  @IsEnum(ReportTargetType)
  targetType: ReportTargetType;

  @IsOptional()
  @IsUUID()
  questionId?: string;

  @IsOptional()
  @IsUUID()
  answerId?: string;

  @IsOptional()
  @IsUUID()
  targetUserId?: string;

  @IsString()
  reason: string;
}
