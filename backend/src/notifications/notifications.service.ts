import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getNotifications(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getUnreadCount(userId: number) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(id: number, userId: number) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.userId !== userId) throw new NotFoundException('Notification not found');
    if (notification.ipvStatusId && await this.prisma.iPVStatus.findFirst({ where: { id: notification.ipvStatusId, status: 'NOT_STARTED' } })) throw new BadRequestException('Уведомление активно до начала ИПВ');

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false, ipvStatusId: null },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async createNotification(data: { userId: number; title: string; message: string }) {
    return this.prisma.notification.create({
      data,
    });
  }
}
