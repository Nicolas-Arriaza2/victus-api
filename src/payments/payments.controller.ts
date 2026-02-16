import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePreferenceDto } from './dto/create-preference.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('payments')
@UseGuards(JwtGuard)
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Post('create-preference')
  createPreference(@Req() req: any, @Body() dto: CreatePreferenceDto) {
    return this.service.createPreference(req.user.sub, dto.sessionId);
  }

  @Get('my-earnings')
  @UseGuards(RolesGuard)
  @Roles('COMMUNITY_LEADER')
  getMyEarnings(@Req() req: any) {
    return this.service.getLeaderEarnings(req.user.sub);
  }

  @Get('pending-transfers')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  getPendingTransfers() {
    return this.service.getPendingTransfers();
  }

  @Get('platform-revenue')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  getPlatformRevenue() {
    return this.service.getPlatformRevenue();
  }

  @Post(':paymentId/mark-transferred')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  markTransferred(
    @Param('paymentId') paymentId: string,
    @Req() req: any,
    @Body() body: { notes?: string },
  ) {
    return this.service.markTransferred(paymentId, req.user.sub, body.notes);
  }

  @Get('transfer-schedule')
  getTransferSchedule() {
    return this.service.getTransferSchedule();
  }
}
