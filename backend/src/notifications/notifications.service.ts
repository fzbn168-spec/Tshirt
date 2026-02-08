import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async create(
    userId: string | null,
    type: string,
    title: string,
    content: string,
    referenceId?: string,
    referenceType?: string,
  ) {
    // 1. Create DB Notification
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        content,
        referenceId,
        referenceType,
      },
    });

    return notification;
  }

  async notifyAdmin(type: string, title: string, content: string, referenceId?: string, referenceType?: string) {
      // 1. Send Email to Admin
      // In a real app, you might have multiple admins.
      // For now, we use the env variable or a default.
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
      await this.emailService.sendMail(adminEmail, title, content);

      // 2. Create Notification (User ID null implies System/Admin)
      await this.create(null, type, title, content, referenceId, referenceType);
  }

  async notifyUser(userId: string, email: string, type: string, title: string, content: string, referenceId?: string, referenceType?: string) {
      // 1. Send Email
      await this.emailService.sendMail(email, title, content);

      // 2. Create Notification
      await this.create(userId, type, title, content, referenceId, referenceType);
  }

  async notifyEmailOnly(email: string, title: string, content: string) {
      // For anonymous users or fallbacks, just send email
      await this.emailService.sendMail(email, title, content);
  }

  async findAll(userId: string, role?: string) {
    if (role === 'ADMIN' || role === 'PLATFORM_ADMIN') {
      return this.prisma.notification.findMany({
        where: {
          OR: [
            { userId },
            { userId: null }
          ]
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }
}
