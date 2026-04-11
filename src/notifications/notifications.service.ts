import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { PrismaService } from '../prisma/prisma.service';

const expo = new Expo();

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async savePushToken(userId: string, token: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { expoPushToken: token },
      select: { id: true },
    });
  }

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    metadata?: Record<string, any>,
  ) {
    const notification = await this.prisma.notification.create({
      data: { userId, type, title, body, metadata },
    });

    // Send push notification if user has a registered token
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { expoPushToken: true },
      });

      if (user?.expoPushToken && Expo.isExpoPushToken(user.expoPushToken)) {
        const message: ExpoPushMessage = {
          to: user.expoPushToken,
          sound: 'default',
          title,
          body,
          data: metadata ?? {},
        };
        await expo.sendPushNotificationsAsync([message]);
      }
    } catch {
      // Push failure must not break notification creation
    }

    return notification;
  }

  getByUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }
}
