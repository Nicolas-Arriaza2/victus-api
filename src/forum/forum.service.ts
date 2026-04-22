import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const AUTHOR_SELECT = {
  id: true,
  username: true,
  profile: { select: { firstName: true, lastName: true, avatarUrl: true } },
};

@Injectable()
export class ForumService {
  constructor(private prisma: PrismaService) {}

  async listQuestions(activityId: string) {
    return this.prisma.forumQuestion.findMany({
      where: { activityId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: AUTHOR_SELECT },
        answers: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: AUTHOR_SELECT } },
        },
      },
    });
  }

  async createQuestion(activityId: string, authorId: string, body: string) {
    const activity = await this.prisma.activity.findUnique({ where: { id: activityId } });
    if (!activity) throw new NotFoundException('Activity not found');

    return this.prisma.forumQuestion.create({
      data: { activityId, authorId, body },
      include: {
        author: { select: AUTHOR_SELECT },
        answers: true,
      },
    });
  }

  async createAnswer(questionId: string, authorId: string, body: string) {
    const question = await this.prisma.forumQuestion.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException('Question not found');

    return this.prisma.forumAnswer.create({
      data: { questionId, authorId, body },
      include: { author: { select: AUTHOR_SELECT } },
    });
  }

  async deleteQuestion(questionId: string, requesterId: string) {
    const question = await this.prisma.forumQuestion.findUnique({
      where: { id: questionId },
      include: { activity: { select: { createdById: true } } },
    });
    if (!question) throw new NotFoundException('Question not found');

    const isAuthor  = question.authorId === requesterId;
    const isLeader  = question.activity.createdById === requesterId;
    if (!isAuthor && !isLeader) throw new ForbiddenException();

    await this.prisma.forumQuestion.delete({ where: { id: questionId } });
    return { message: 'Question deleted' };
  }

  async deleteAnswer(answerId: string, requesterId: string) {
    const answer = await this.prisma.forumAnswer.findUnique({
      where: { id: answerId },
      include: {
        question: { include: { activity: { select: { createdById: true } } } },
      },
    });
    if (!answer) throw new NotFoundException('Answer not found');

    const isAuthor = answer.authorId === requesterId;
    const isLeader = answer.question.activity.createdById === requesterId;
    if (!isAuthor && !isLeader) throw new ForbiddenException();

    await this.prisma.forumAnswer.delete({ where: { id: answerId } });
    return { message: 'Answer deleted' };
  }
}
