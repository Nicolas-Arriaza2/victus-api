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
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentStatusDto } from './dto/update-enrollment-status.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('enrollments')
@UseGuards(JwtGuard)
export class EnrollmentsController {
  constructor(private readonly service: EnrollmentsService) {}

  @Post()
  enroll(@Req() req: any, @Body() dto: CreateEnrollmentDto) {
    return this.service.enroll(req.user.sub, dto.sessionId);
  }

  @Patch(':id/cancel')
  cancel(@Req() req: any, @Param('id') id: string) {
    return this.service.cancel(req.user.sub, id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('COMMUNITY_LEADER', 'ADMIN')
  updateStatus(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateEnrollmentStatusDto,
  ) {
    return this.service.updateStatusByLeader(id, req.user.sub, dto.status);
  }

  @Get('mine')
  getMyEnrollments(@Req() req: any) {
    return this.service.getMyEnrollments(req.user.sub);
  }

  @Get()
  getSessionEnrollments(@Query('sessionId') sessionId: string) {
    return this.service.getSessionEnrollments(sessionId);
  }
}
