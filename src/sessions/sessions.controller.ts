import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
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
}
