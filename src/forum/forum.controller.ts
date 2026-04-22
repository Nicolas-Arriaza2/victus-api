import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ForumService } from './forum.service';
import { JwtGuard } from '../auth/guards/jwt.guard';

@Controller('activities/:activityId/forum')
export class ForumController {
  constructor(private readonly service: ForumService) {}

  @Get()
  listQuestions(@Param('activityId') activityId: string) {
    return this.service.listQuestions(activityId);
  }

  @Post()
  @UseGuards(JwtGuard)
  createQuestion(
    @Param('activityId') activityId: string,
    @Req() req: any,
    @Body('body') body: string,
  ) {
    return this.service.createQuestion(activityId, req.user.sub, body);
  }

  @Post(':questionId/answers')
  @UseGuards(JwtGuard)
  createAnswer(
    @Param('questionId') questionId: string,
    @Req() req: any,
    @Body('body') body: string,
  ) {
    return this.service.createAnswer(questionId, req.user.sub, body);
  }

  @Delete(':questionId')
  @UseGuards(JwtGuard)
  deleteQuestion(@Param('questionId') questionId: string, @Req() req: any) {
    return this.service.deleteQuestion(questionId, req.user.sub);
  }

  @Delete(':questionId/answers/:answerId')
  @UseGuards(JwtGuard)
  deleteAnswer(@Param('answerId') answerId: string, @Req() req: any) {
    return this.service.deleteAnswer(answerId, req.user.sub);
  }
}
