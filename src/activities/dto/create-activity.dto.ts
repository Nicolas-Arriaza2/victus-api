import { IsString, IsOptional, IsEnum, IsArray, IsInt, Min } from 'class-validator';
import { ActivityType, ActivityPricingModel } from '@prisma/client';

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

  @IsOptional()
  @IsEnum(ActivityPricingModel)
  pricingModel?: ActivityPricingModel;

  @IsOptional()
  @IsInt()
  @Min(1)
  monthlyPriceCents?: number;
}
