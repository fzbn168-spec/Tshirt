import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateShippingDto } from './dto/create-shipping.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailTemplates } from '../email/email.templates';

@Injectable()
export class ShippingsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(createShippingDto: CreateShippingDto) {
    const { orderId, trackingNo, carrier } = createShippingDto;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (
      order.status === 'SHIPPED' ||
      order.status === 'COMPLETED' ||
      order.status === 'CANCELLED'
    ) {
      throw new BadRequestException(
        `Order cannot be shipped (Current status: ${order.status})`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const shipping = await tx.shipping.create({
        data: {
          orderId,
          trackingNo,
          carrier,
        },
      });

      // Update Order Status
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'SHIPPED' },
      });

      return shipping;
    });

    // Notify User
    // We need user info, which wasn't fetched initially.
    const fullOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (fullOrder?.user) {
      await this.notificationsService.notifyUser(
        fullOrder.userId,
        fullOrder.user.email,
        'ORDER_SHIPPED',
        `Order Shipped: ${fullOrder.orderNo}`,
        EmailTemplates.shippingUpdate(
          fullOrder.user.fullName || 'Customer',
          fullOrder.orderNo,
          carrier,
          trackingNo,
        ),
        orderId,
        'ORDER',
      );
    }

    return result;
  }

  async findByOrder(orderId: string) {
    return this.prisma.shipping.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
