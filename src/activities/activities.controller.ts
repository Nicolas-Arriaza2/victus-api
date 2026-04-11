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
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly service: ActivitiesService) {}

  @Get()
  findAll(
    @Query('type') type?: string,
    @Query('interestId') interestId?: string,
  ) {
    return this.service.findAll({ type, interestId });
  }

  @Get('mine')
  @UseGuards(JwtGuard)
  getMyActivities(@Req() req: any) {
    return this.service.getMyActivities(req.user.sub);
  }

  @Get(':id/dashboard')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('COMMUNITY_LEADER', 'ADMIN')
  getDashboard(@Param('id') id: string, @Req() req: any) {
    return this.service.getDashboard(id, req.user.sub);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  @UseGuards(JwtGuard)
  create(@Req() req: any, @Body() dto: CreateActivityDto) {
    return this.service.create(req.user.sub, dto);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('COMMUNITY_LEADER', 'ADMIN')
  update(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateActivityDto,
  ) {
    return this.service.update(id, req.user.sub, dto);
  }
}
