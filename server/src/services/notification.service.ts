import { Notification } from '@prisma/client';
import prisma from '../data-source';
import { BaseService } from './base.service';
import { AppError } from '../utils/AppError';
import { PaginationQuery } from '../types';

type CreateNotificationDto = {
  userId: string; title: string; message: string;
  type?: string; rideId?: string;
};
type UpdateNotificationDto = { read?: boolean };

export class NotificationService extends BaseService<
  Notification, CreateNotificationDto, UpdateNotificationDto
> {
  protected get model()     { return prisma.notification; }
  protected get modelName() { return 'Notification'; }

  async getMyNotifications(userId: string, query: PaginationQuery) {
    return this.getAll(query, { userId }, undefined, 'createdAt');
  }

  async markRead(id: string, userId: string): Promise<Notification> {
    const notif = await this.getById(id);
    if ((notif as any).userId !== userId) {
      throw AppError.forbidden('Not your notification');
    }
    return prisma.notification.update({
      where: { id },
      data:  { read: true },
    });
  }

  async markAllRead(userId: string): Promise<{ count: number }> {
    const result = await prisma.notification.updateMany({
      where: { userId, read: false },
      data:  { read: true },
    });
    return { count: result.count };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, read: false } });
  }

  async deleteNotification(id: string, userId: string): Promise<void> {
    const notif = await this.getById(id);
    if ((notif as any).userId !== userId) {
      throw AppError.forbidden('Not your notification');
    }
    await this.delete(id);
  }
}

export const notificationService = new NotificationService();
