import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Req, UseGuards } from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { JwtGuard } from '../auth/guards/jwt.guard';

@Controller('blocks')
@UseGuards(JwtGuard)
export class BlocksController {
  constructor(private readonly service: BlocksService) {}

  @Post(':userId')
  @HttpCode(HttpStatus.CREATED)
  block(@Req() req: any, @Param('userId') userId: string) {
    return this.service.block(req.user.sub, userId);
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  unblock(@Req() req: any, @Param('userId') userId: string) {
    return this.service.unblock(req.user.sub, userId);
  }

  @Get()
  myBlocked(@Req() req: any) {
    return this.service.myBlockedIds(req.user.sub);
  }
}
