import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SwipesService } from './swipes.service';
import { CreateSwipeDto } from './dto/create-swipe.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';

@Controller('swipes')
@UseGuards(JwtGuard)
export class SwipesController {
  constructor(private readonly service: SwipesService) {}

  @Post()
  swipe(@Req() req: any, @Body() dto: CreateSwipeDto) {
    return this.service.swipe(req.user.sub, dto);
  }

  @Get('candidates')
  getCandidates(
    @Req() req: any,
    @Query('sessionId') sessionId: string,
  ) {
    return this.service.getCandidates(req.user.sub, sessionId);
  }

  @Get('who-liked-me')
  whoLikedMe(
    @Req() req: any,
    @Query('sessionId') sessionId: string,
  ) {
    return this.service.whoLikedMe(req.user.sub, sessionId);
  }
}
