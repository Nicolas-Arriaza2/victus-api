import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { JwtGuard } from '../auth/guards/jwt.guard';

@Controller('matches')
@UseGuards(JwtGuard)
export class MatchesController {
  constructor(private readonly service: MatchesService) {}

  @Get()
  getMyMatches(@Req() req: any) {
    return this.service.getMyMatches(req.user.sub);
  }

  @Get('stats')
  getCompatibilityStats(@Req() req: any) {
    return this.service.getCompatibilityStats(req.user.sub);
  }

  @Get('session')
  getSessionMatches(
    @Req() req: any,
    @Query('sessionId') sessionId: string,
  ) {
    return this.service.getSessionMatches(req.user.sub, sessionId);
  }
}
