import { IsString, IsOptional, IsBoolean, IsArray, IsEnum, IsInt, Min } from 'class-validator';
import { ActivityPricingModel } from '@prisma/client';

export class UpdateActivityDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

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
