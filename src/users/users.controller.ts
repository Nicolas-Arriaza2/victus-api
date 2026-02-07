import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateInterestsDto } from './dto/update-interests.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';

@Controller('users')
@UseGuards(JwtGuard)
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('me')
  getMe(@Req() req: any) {
    return this.service.findById(req.user.sub);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch('me/profile')
  updateMyProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.service.updateProfile(req.user.sub, dto);
  }

  @Put('me/interests')
  setMyInterests(@Req() req: any, @Body() dto: UpdateInterestsDto) {
    return this.service.setInterests(req.user.sub, dto.interestIds);
  }
}
