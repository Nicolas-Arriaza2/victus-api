import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { InterestsService } from './interests.service';
import { CreateInterestDto } from './dto/create-interest.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('interests')
export class InterestsController {
  constructor(private readonly service: InterestsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateInterestDto) {
    return this.service.create(dto);
  }
}
