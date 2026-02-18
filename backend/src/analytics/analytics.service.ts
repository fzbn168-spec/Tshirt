import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateAnalyticsEventDto } from './dto/create-analytics-event.dto';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async trackEvent(dto: CreateAnalyticsEventDto) {
    return this.prisma.analyticsEvent.create({
      data: {
        eventType: dto.eventType,
        userId: dto.userId,
        sessionId: dto.sessionId,
        metadata: dto.metadata,
      },
    });
  }

  async getDashboardStats() {
    // 1. Total Visits (Unique Sessions today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const visitsToday = await this.prisma.analyticsEvent.count({
      where: {
        eventType: 'VISIT',
        createdAt: { gte: today },
      },
    });

    const totalVisits = await this.prisma.analyticsEvent.count({
      where: { eventType: 'VISIT' },
    });

    // 2. Orders Stats (Real Sales)
    const ordersToday = await this.prisma.order.count({
      where: {
        createdAt: { gte: today },
        status: { not: 'CANCELLED' },
      },
    });

    const totalOrders = await this.prisma.order.count({
      where: { status: { not: 'CANCELLED' } },
    });

    // 3. Conversion Rate (Today)
    // Avoid division by zero
    const conversionRate =
      visitsToday > 0 ? (ordersToday / visitsToday) * 100 : 0;

    return {
      visits: { today: visitsToday, total: totalVisits },
      orders: { today: ordersToday, total: totalOrders },
      conversionRate: parseFloat(conversionRate.toFixed(2)),
    };
  }

  async getFunnelData(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(0); // Epoch if not specified
    const end = endDate ? new Date(endDate) : new Date();

    const whereClause = {
      createdAt: {
        gte: start,
        lte: end,
      },
    };

    // Funnel Steps: VIEW_PRODUCT -> ADD_TO_CART -> INITIATE_CHECKOUT -> PURCHASE
    // Using Promise.all for parallel execution
    const [viewProduct, addToCart, checkout, purchase] = await Promise.all([
      this.prisma.analyticsEvent.count({
        where: { ...whereClause, eventType: 'VIEW_PRODUCT' },
      }),
      this.prisma.analyticsEvent.count({
        where: { ...whereClause, eventType: 'ADD_TO_CART' },
      }),
      this.prisma.analyticsEvent.count({
        where: { ...whereClause, eventType: 'INITIATE_CHECKOUT' },
      }),
      // For purchase, we can count events OR real orders. Let's use events for consistency in the funnel.
      // But we should ensure we track 'PURCHASE' event upon order completion.
      this.prisma.analyticsEvent.count({
        where: { ...whereClause, eventType: 'PURCHASE' },
      }),
    ]);

    return {
      funnel: [
        { step: 'Product View', count: viewProduct },
        { step: 'Add to Cart', count: addToCart },
        { step: 'Checkout', count: checkout },
        { step: 'Purchase', count: purchase },
      ],
      period: { start, end },
    };
  }
}
