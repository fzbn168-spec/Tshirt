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

  async notifyAdmin(
    type: string,
    title: string,
    content: string,
    referenceId?: string,
    referenceType?: string,
  ) {
    // 1. Send Email to Admin
    // In a real app, you might have multiple admins.
    // For now, we use the env variable or a default.
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    await this.emailService.sendMail(adminEmail, title, content);

    // 2. Create Notification (User ID null implies System/Admin)
    await this.create(null, type, title, content, referenceId, referenceType);
  }

  async notifyUser(
    userId: string,
    email: string,
    type: string,
    title: string,
    content: string,
    referenceId?: string,
    referenceType?: string,
  ) {
    // 1. Send Email
    await this.emailService.sendMail(email, title, content);

    // 2. Create Notification
    await this.create(userId, type, title, content, referenceId, referenceType);
  }

  async notifyEmailOnly(email: string, title: string, content: string) {
    // For anonymous users or fallbacks, just send email
    await this.emailService.sendMail(email, title, content);
  }

  async findAll(
    userId: string,
    role?: string,
    opts?: {
      skip?: number;
      take?: number;
      isRead?: boolean;
      type?: string;
      referenceType?: string;
      q?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const whereBase =
      role === 'ADMIN' || role === 'PLATFORM_ADMIN'
        ? { OR: [{ userId }, { userId: null }] }
        : { userId };

    const where: Record<string, any> = { ...whereBase };
    if (typeof opts?.isRead === 'boolean') where.isRead = opts.isRead;
    if (opts?.type) where.type = opts.type;
    if (opts?.referenceType) where.referenceType = opts.referenceType;
    if (opts?.q) {
      const or = [
        { title: { contains: opts.q, mode: 'insensitive' as const } },
        { content: { contains: opts.q, mode: 'insensitive' as const } },
      ];
      if (where.AND && Array.isArray(where.AND)) {
        where.AND.push({ OR: or });
      } else if (where.AND) {
        where.AND = [where.AND, { OR: or }];
      } else {
        where.AND = [{ OR: or }];
      }
    }
    if (opts?.startDate || opts?.endDate) {
      const createdAt: Record<string, Date> = {};
      if (opts.startDate) createdAt.gte = new Date(opts.startDate);
      if (opts.endDate) createdAt.lte = new Date(opts.endDate);
      where.createdAt = createdAt;
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: opts?.skip,
      take: opts?.take,
    });
  }

  async countAll(
    userId: string,
    role?: string,
    opts?: {
      isRead?: boolean;
      type?: string;
      referenceType?: string;
      q?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const whereBase =
      role === 'ADMIN' || role === 'PLATFORM_ADMIN'
        ? { OR: [{ userId }, { userId: null }] }
        : { userId };
    const where: Record<string, any> = { ...whereBase };
    if (typeof opts?.isRead === 'boolean') where.isRead = opts.isRead;
    if (opts?.type) where.type = opts.type;
    if (opts?.referenceType) where.referenceType = opts.referenceType;
    if (opts?.q) {
      const or = [
        { title: { contains: opts.q, mode: 'insensitive' as const } },
        { content: { contains: opts.q, mode: 'insensitive' as const } },
      ];
      if (where.AND && Array.isArray(where.AND)) {
        where.AND.push({ OR: or });
      } else if (where.AND) {
        where.AND = [where.AND, { OR: or }];
      } else {
        where.AND = [{ OR: or }];
      }
    }
    if (opts?.startDate || opts?.endDate) {
      const createdAt: Record<string, Date> = {};
      if (opts.startDate) createdAt.gte = new Date(opts.startDate);
      if (opts.endDate) createdAt.lte = new Date(opts.endDate);
      where.createdAt = createdAt;
    }
    return this.prisma.notification.count({ where });
  }
  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAsUnread(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: false },
    });
  }

  async markAllAsReadForUser(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async getTypes(userId: string, role?: string) {
    const where =
      role === 'ADMIN' || role === 'PLATFORM_ADMIN'
        ? { OR: [{ userId }, { userId: null }] }
        : { userId };
    const rows = await this.prisma.notification.findMany({
      where,
      distinct: ['type'],
      select: { type: true },
      orderBy: { type: 'asc' },
    });
    return rows.map((r) => r.type).filter(Boolean);
  }

  async getReferenceTypes(userId: string, role?: string) {
    const where =
      role === 'ADMIN' || role === 'PLATFORM_ADMIN'
        ? { OR: [{ userId }, { userId: null }] }
        : { userId };
    const rows = await this.prisma.notification.findMany({
      where,
      distinct: ['referenceType'],
      select: { referenceType: true },
      orderBy: { referenceType: 'asc' },
    });
    return rows.map((r) => r.referenceType).filter(Boolean);
  }
}
