import {
  IsString,
  IsDateString,
  IsOptional,
  IsInt,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateSessionDto {
  @IsString()
  activityId: string;

  @IsDateString()
  startsAt: string;

  @IsDateString()
  endsAt: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  priceCents?: number;

  @IsOptional()
  @IsString()
  locationName?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}
