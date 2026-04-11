import { IsOptional, IsString, IsNumber, IsEnum, IsDateString, IsArray, IsBoolean } from 'class-validator';
import { Gender } from '@prisma/client';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsDateString()
  birthdate?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genderDetails?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sexualOrientation?: string[];

  @IsOptional()
  @IsBoolean()
  showGender?: boolean;

  @IsOptional()
  @IsBoolean()
  showOrientation?: boolean;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}
