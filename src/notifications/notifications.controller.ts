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
import { NotificationsService } from './notifications.service';
import { JwtGuard } from '../auth/guards/jwt.guard';

@Controller('notifications')
@UseGuards(JwtGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Post('push-token')
  registerPushToken(@Body('token') token: string, @Req() req: any) {
    return this.service.savePushToken(req.user.sub, token);
  }

  @Get('me')
  getMyNotifications(@Req() req: any) {
    return this.service.getByUser(req.user.sub);
  }

  @Get('me/unread-count')
  async getUnreadCount(@Req() req: any) {
    const count = await this.service.getUnreadCount(req.user.sub);
    return { count };
  }

  @Patch('mark-all-read')
  markAllRead(@Req() req: any) {
    return this.service.markAllRead(req.user.sub);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Req() req: any) {
    return this.service.markAsRead(id, req.user.sub);
  }
}
