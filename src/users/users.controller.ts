import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateInterestsDto } from './dto/update-interests.dto';
import { UpsertBankInfoDto } from './dto/upsert-bank-info.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';

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

  @Get('me/stats')
  @UseGuards(RolesGuard)
  @Roles('COMMUNITY_LEADER', 'ADMIN')
  getLeaderStats(@Req() req: any) {
    return this.service.getLeaderStats(req.user.sub);
  }

  @Get('me/bank-info')
  @UseGuards(RolesGuard)
  @Roles('COMMUNITY_LEADER', 'ADMIN')
  getBankInfo(@Req() req: any) {
    return this.service.getBankInfo(req.user.sub);
  }

  @Put('me/bank-info')
  @UseGuards(RolesGuard)
  @Roles('COMMUNITY_LEADER', 'ADMIN')
  upsertBankInfo(@Req() req: any, @Body() dto: UpsertBankInfoDto) {
    return this.service.upsertBankInfo(req.user.sub, dto);
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

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMyAccount(@Req() req: any) {
    return this.service.deleteMyAccount(req.user.sub);
  }
}
