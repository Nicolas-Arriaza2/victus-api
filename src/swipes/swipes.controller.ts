import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
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

  @Get('discover')
  getDiscoverCandidates(
    @Req() req: any,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('maxDistance') maxDistance?: string,
    @Query('minAge') minAge?: string,
    @Query('maxAge') maxAge?: string,
    @Query('gender') gender?: string,
  ) {
    return this.service.getDiscoverCandidates(req.user.sub, {
      lat: lat ? parseFloat(lat) : undefined,
      lng: lng ? parseFloat(lng) : undefined,
      maxDistance: maxDistance ? parseInt(maxDistance, 10) : undefined,
      minAge: minAge ? parseInt(minAge, 10) : undefined,
      maxAge: maxAge ? parseInt(maxAge, 10) : undefined,
      gender,
    });
  }

  @Get('candidates')
  getCandidates(@Req() req: any, @Query('sessionId') sessionId: string) {
    return this.service.getCandidates(req.user.sub, sessionId);
  }

  @Get('who-liked-me')
  whoLikedMe(@Req() req: any, @Query('sessionId') sessionId: string) {
    return this.service.whoLikedMe(req.user.sub, sessionId);
  }
}
