import { IsString, IsEnum, IsOptional } from 'class-validator';
import { SwipeAction } from '@prisma/client';

export class CreateSwipeDto {
  @IsString()
  toUserId: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsEnum(SwipeAction)
  action: SwipeAction;
}
