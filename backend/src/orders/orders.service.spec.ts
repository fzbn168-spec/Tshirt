import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockPrismaService = {
  $transaction: jest.fn((callback) => callback(mockPrismaService)),
  sku: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  order: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  inquiry: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

const mockNotificationsService = {
  notifyAdmin: jest.fn(),
  notifyUser: jest.fn(),
};

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const userId = 'user-1';
    const companyId = 'company-1';
    const createOrderDto = {
      items: [
        {
          productId: 'prod-1',
          skuId: 'sku-1',
          quantity: 10,
          skuSpecs: 'Color: Red',
        },
      ],
      type: 'STANDARD',
    };

    const mockSku = {
      id: 'sku-1',
      skuCode: 'SKU-001',
      price: 100,
      stock: 50,
      moq: 5,
      tierPrices: JSON.stringify([
        { minQty: 20, price: 90 },
        { minQty: 50, price: 80 },
      ]),
      product: {
        title: JSON.stringify({ en: 'Product 1' }),
      },
    };

    it('should create an order successfully with base price', async () => {
      mockPrismaService.sku.findUnique.mockResolvedValue(mockSku);
      mockPrismaService.order.create.mockResolvedValue({
        id: 'order-1',
        orderNo: 'ORD-123',
        totalAmount: 1000,
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'user@example.com',
        fullName: 'Test User',
      });

      const result = await service.create(
        userId,
        companyId,
        createOrderDto as any,
      );

      expect(prisma.sku.findUnique).toHaveBeenCalledWith({
        where: { id: 'sku-1' },
        include: { product: true },
      });

      // Stock decrement
      expect(prisma.sku.update).toHaveBeenCalledWith({
        where: { id: 'sku-1' },
        data: { stock: { decrement: 10 } },
      });

      // Order creation
      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalAmount: 1000, // 10 * 100
          }),
        }),
      );

      expect(result).toBeDefined();
    });

    it('should apply tiered pricing correctly', async () => {
      const largeOrderDto = {
        ...createOrderDto,
        items: [{ ...createOrderDto.items[0], quantity: 25 }], // > 20, should be price 90
      };

      mockPrismaService.sku.findUnique.mockResolvedValue(mockSku);
      mockPrismaService.order.create.mockResolvedValue({ id: 'order-2' });

      await service.create(userId, companyId, largeOrderDto as any);

      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalAmount: 2250, // 25 * 90
          }),
        }),
      );
    });

    it('should throw BadRequestException if insufficient stock', async () => {
      const hugeOrderDto = {
        ...createOrderDto,
        items: [{ ...createOrderDto.items[0], quantity: 100 }], // > stock 50
      };

      mockPrismaService.sku.findUnique.mockResolvedValue(mockSku);

      await expect(
        service.create(userId, companyId, hugeOrderDto as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if quantity below MOQ', async () => {
      const tinyOrderDto = {
        ...createOrderDto,
        items: [{ ...createOrderDto.items[0], quantity: 2 }], // < MOQ 5
      };

      mockPrismaService.sku.findUnique.mockResolvedValue(mockSku);

      await expect(
        service.create(userId, companyId, tinyOrderDto as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    it('should return stock when order is cancelled', async () => {
      const orderId = 'order-1';
      const mockOrder = {
        id: orderId,
        status: 'PENDING_PAYMENT',
        items: [{ skuId: 'sku-1', quantity: 10 }],
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.update.mockResolvedValue({
        ...mockOrder,
        status: 'CANCELLED',
      });

      await service.updateStatus(orderId, 'CANCELLED');

      expect(prisma.sku.update).toHaveBeenCalledWith({
        where: { id: 'sku-1' },
        data: { stock: { increment: 10 } },
      });
    });
  });
});
