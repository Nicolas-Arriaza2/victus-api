import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './create-report.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';

@Controller('reports')
@UseGuards(JwtGuard)
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Req() req: any, @Body() dto: CreateReportDto) {
    return this.service.create(req.user.sub, dto);
  }
}
