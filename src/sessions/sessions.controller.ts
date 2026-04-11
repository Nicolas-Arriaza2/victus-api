import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('sessions')
export class SessionsController {
  constructor(private readonly service: SessionsService) {}

  @Get()
  findByActivity(@Query('activityId') activityId: string) {
    return this.service.findByActivity(activityId);
  }

  @Post(':id/notify-payment-reminder')
  @UseGuards(JwtGuard)
  notifyPaymentReminder(@Param('id') id: string, @Req() req: any) {
    return this.service.notifyPaymentReminder(id, req.user.sub);
  }

  @Get(':id/stats')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('COMMUNITY_LEADER', 'ADMIN')
  getStats(@Param('id') id: string, @Req() req: any) {
    return this.service.getStats(id, req.user.sub);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('COMMUNITY_LEADER', 'ADMIN')
  create(@Req() req: any, @Body() dto: CreateSessionDto) {
    return this.service.create(req.user.sub, dto);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('COMMUNITY_LEADER', 'ADMIN')
  update(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateSessionDto,
  ) {
    return this.service.update(id, req.user.sub, dto);
  }
}
