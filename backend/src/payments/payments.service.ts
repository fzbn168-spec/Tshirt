import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailTemplates } from '../email/email.templates';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(userId: string, createPaymentDto: CreatePaymentDto) {
    const { orderId, amount, method, transactionId } = createPaymentDto;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      // In a real app, verify ownership or company membership
    }

    if (order.status === 'COMPLETED' || order.status === 'SHIPPED') {
      throw new BadRequestException('Order is already processed');
    }

    let status = 'COMPLETED';
    if (method === 'WIRE') {
      status = 'PENDING'; // Offline payments need admin approval
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          orderId,
          amount,
          method,
          status,
          transactionId: transactionId || `TX-${Date.now()}`,
          proofUrl: createPaymentDto.proofUrl,
        },
      });

      if (status === 'COMPLETED') {
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'PROCESSING' }, // Paid -> Processing
        });
      }

      return payment;
    });

    // Notify Admin about new payment
    await this.notificationsService.notifyAdmin(
      'PAYMENT',
      `New Payment: ${order.orderNo}`,
      `<p>New payment of ${createPaymentDto.amount} via ${createPaymentDto.method} for Order ${order.orderNo}.</p><p>Status: ${status}</p>`,
      orderId,
      'ORDER',
    );

    return result;
  }

  async findOne(id: string) {
    return this.prisma.payment.findUnique({
      where: { id },
    });
  }

  async findByOrder(orderId: string) {
    return this.prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findForUser(userId: string) {
    return this.prisma.payment.findMany({
      where: {
        order: {
          userId,
        },
      },
      include: {
        order: {
          include: {
            company: {
              select: {
                name: true,
                contactEmail: true,
                address: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, status: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.update({
        where: { id },
        data: { status },
        include: { order: { include: { user: true } } },
      });

      if (status === 'COMPLETED') {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: 'PROCESSING' },
        });
      }
      return payment;
    });

    if (status === 'COMPLETED' && result.order?.user) {
      await this.notificationsService.notifyUser(
        result.order.userId,
        result.order.user.email,
        'PAYMENT_APPROVED',
        `Payment Approved for Order ${result.order.orderNo}`,
        EmailTemplates.paymentApproved(
          result.order.user.fullName || 'Customer',
          result.order.orderNo,
          Number(result.amount),
        ),
        result.orderId,
        'ORDER',
      );
    }

    return result;
  }
}
