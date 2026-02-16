import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsBillingService } from './subscriptions-billing.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { MarkTransferredDto } from './dto/mark-transferred.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('subscriptions')
@UseGuards(JwtGuard)
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly billingService: SubscriptionsBillingService,
  ) {}

  @Post()
  subscribe(@Req() req: any, @Body() dto: SubscribeDto) {
    return this.subscriptionsService.subscribe(req.user.sub, dto.activityId);
  }

  @Get('mine')
  getMySubscriptions(@Req() req: any) {
    return this.subscriptionsService.getMySubscriptions(req.user.sub);
  }

  @Get('pending-transfers')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  getPendingTransfers() {
    return this.billingService.getPendingTransfers();
  }

  @Get('activity/:activityId')
  @UseGuards(RolesGuard)
  @Roles('COMMUNITY_LEADER')
  getActivitySubscribers(
    @Req() req: any,
    @Param('activityId') activityId: string,
  ) {
    return this.subscriptionsService.getActivitySubscribers(
      activityId,
      req.user.sub,
    );
  }

  @Post('billings/:id/mark-transferred')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  markTransferred(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: MarkTransferredDto,
  ) {
    return this.billingService.markTransferred(id, req.user.sub, dto.notes);
  }

  @Get(':id')
  getSubscriptionDetail(@Req() req: any, @Param('id') id: string) {
    return this.subscriptionsService.getSubscriptionDetail(req.user.sub, id);
  }

  @Post(':id/pay')
  payCurrentBilling(@Req() req: any, @Param('id') id: string) {
    return this.subscriptionsService.payCurrentBilling(req.user.sub, id);
  }

  @Patch(':id/cancel')
  cancelSubscription(@Req() req: any, @Param('id') id: string) {
    return this.subscriptionsService.cancelSubscription(req.user.sub, id);
  }
}
