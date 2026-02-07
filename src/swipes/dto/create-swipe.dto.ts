import { IsString, IsEnum } from 'class-validator';
import { SwipeAction } from '@prisma/client';

export class CreateSwipeDto {
  @IsString()
  toUserId: string;

  @IsString()
  sessionId: string;

  @IsEnum(SwipeAction)
  action: SwipeAction;
}
