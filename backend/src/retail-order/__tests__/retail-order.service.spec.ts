import { Test, TestingModule } from '@nestjs/testing';
import { RetailOrderService } from '../retail-order.service';
import { PrismaService } from '../../prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  CreateRetailOrderDto,
  PaymentMethod,
  UpdateRetailOrderStatusDto,
  OrderStatus,
} from '../dto/retail-order.dto';

const mockPrismaService = {
  cart: {
    findUnique: jest.fn(),
  },
  retailOrder: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  retailOrderItem: {
    create: jest.fn(),
  },
  sku: {
    update: jest.fn(),
  },
  product: {
    update: jest.fn(),
  },
  cartItem: {
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(mockPrismaService)), // 模拟事务直接执行回调
};

describe('RetailOrderService', () => {
  let service: RetailOrderService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetailOrderService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RetailOrderService>(RetailOrderService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    const userId = 'user-1';
    const dto: CreateRetailOrderDto = {
      shippingAddress: { city: 'New York' },
      paymentMethod: PaymentMethod.BANK_TRANSFER,
    };

    it('should create order successfully', async () => {
      // Mock 购物车有商品
      const mockCart = {
        id: 'cart-1',
        items: [
          {
            skuId: 'sku-1',
            quantity: 2,
            sku: {
              id: 'sku-1',
              stock: 10,
              retailPrice: 100,
              skuCode: 'SKU-1',
              productId: 'prod-1',
              product: { basePrice: 100 },
            },
          },
        ],
      };
      prisma.cart.findUnique.mockResolvedValue(mockCart);

      // Mock 订单创建返回
      const mockOrder = {
        id: 'order-1',
        totalAmount: 200,
        ...dto,
      };
      prisma.retailOrder.create.mockResolvedValue(mockOrder);

      const result = await service.createOrder(userId, dto);

      // 验证流程
      expect(prisma.retailOrder.create).toHaveBeenCalled();
      expect(prisma.retailOrderItem.create).toHaveBeenCalledTimes(1); // 1个商品项
      expect(prisma.sku.update).toHaveBeenCalledWith({
        where: { id: 'sku-1' },
        data: expect.objectContaining({ stock: { decrement: 2 } }),
      });
      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cartId: 'cart-1' },
      });
      expect(result).toHaveProperty('paymentInfo'); // 银行转账应返回支付信息
    });

    it('should throw BadRequestException if cart is empty', async () => {
      prisma.cart.findUnique.mockResolvedValue({ id: 'cart-1', items: [] });

      await expect(service.createOrder(userId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if stock insufficient', async () => {
      const mockCart = {
        id: 'cart-1',
        items: [
          {
            skuId: 'sku-1',
            quantity: 5,
            sku: {
              id: 'sku-1',
              stock: 2, // 库存不足
              skuCode: 'SKU-1',
            },
          },
        ],
      };
      prisma.cart.findUnique.mockResolvedValue(mockCart);

      await expect(service.createOrder(userId, dto)).rejects.toThrow(
        BadRequestException,
      );
      // 事务不应执行（mock $transaction 会立即执行回调，但在实际代码中是在回调前抛出异常，所以这里验证 create 不被调用）
      expect(prisma.retailOrder.create).not.toHaveBeenCalled();
    });
  });

  describe('getOrders', () => {
    it('should return orders with pagination', async () => {
      const mockOrders = [{ id: 'order-1' }];
      const total = 1;
      prisma.retailOrder.findMany.mockResolvedValue(mockOrders);
      prisma.retailOrder.count.mockResolvedValue(total);

      const result = await service.getOrders('user-1', 1, 10);

      expect(result.data).toEqual(mockOrders);
      expect(result.meta.total).toBe(total);
      expect(prisma.retailOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      );
    });

    it('should allow admin to query all orders', async () => {
      await service.getOrders(undefined, 1, 10);
      expect(prisma.retailOrder.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }), // 无 userId 限制
      );
    });
  });

  describe('getOrderById', () => {
    const orderId = 'order-1';
    const userId = 'user-1';

    it('should return order detail', async () => {
      const mockOrder = { id: orderId, userId };
      prisma.retailOrder.findUnique.mockResolvedValue(mockOrder);

      const result = await service.getOrderById(orderId, userId);
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException if order not found', async () => {
      prisma.retailOrder.findUnique.mockResolvedValue(null);
      await expect(service.getOrderById(orderId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if user tries to access others order', async () => {
      const mockOrder = { id: orderId, userId: 'other-user' };
      prisma.retailOrder.findUnique.mockResolvedValue(mockOrder);

      await expect(service.getOrderById(orderId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should allow admin (userId undefined) to access any order', async () => {
      const mockOrder = { id: orderId, userId: 'other-user' };
      prisma.retailOrder.findUnique.mockResolvedValue(mockOrder);

      const result = await service.getOrderById(orderId, undefined);
      expect(result).toEqual(mockOrder);
    });
  });

  describe('updateOrderStatus', () => {
    const orderId = 'order-1';
    const dto: UpdateRetailOrderStatusDto = {
      orderStatus: OrderStatus.SHIPPED,
    };

    it('should update status successfully', async () => {
      prisma.retailOrder.findUnique.mockResolvedValue({ id: orderId });
      prisma.retailOrder.update.mockResolvedValue({
        id: orderId,
        orderStatus: OrderStatus.SHIPPED,
      });

      const result = await service.updateOrderStatus(orderId, dto);
      expect(prisma.retailOrder.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: dto,
      });
      expect(result.orderStatus).toBe(OrderStatus.SHIPPED);
    });

    it('should throw NotFoundException if order not found', async () => {
      prisma.retailOrder.findUnique.mockResolvedValue(null);
      await expect(service.updateOrderStatus(orderId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
