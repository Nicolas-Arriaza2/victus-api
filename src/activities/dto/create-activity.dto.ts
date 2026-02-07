import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ActivityType } from '@prisma/client';

export class CreateActivityDto {
  @IsString()
  slug: string;

  @IsString()
  title: string;

  @IsEnum(ActivityType)
  type: ActivityType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interestIds?: string[];
}
