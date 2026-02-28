import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from '../cart.service';
import { PrismaService } from '../../prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

const mockPrismaService = {
  cart: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  cartItem: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  sku: {
    findUnique: jest.fn(),
  },
};

describe('CartService', () => {
  let service: CartService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('getOrCreateCart', () => {
    it('should return existing cart', async () => {
      const mockCart = { id: 'cart-1', userId: 'user-1', items: [] };
      prisma.cart.findUnique.mockResolvedValue(mockCart);

      const result = await service.getOrCreateCart('user-1');
      expect(result).toEqual(mockCart);
      expect(prisma.cart.create).not.toHaveBeenCalled();
    });

    it('should create new cart if not exists', async () => {
      prisma.cart.findUnique.mockResolvedValue(null);
      const mockNewCart = { id: 'cart-new', userId: 'user-1', items: [] };
      prisma.cart.create.mockResolvedValue(mockNewCart);

      const result = await service.getOrCreateCart('user-1');
      expect(result).toEqual(mockNewCart);
      expect(prisma.cart.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { userId: 'user-1' } }),
      );
    });
  });

  describe('addToCart', () => {
    const userId = 'user-1';
    const skuId = 'sku-1';
    const quantity = 2;
    const mockCart = { id: 'cart-1', userId };
    const mockSku = { id: skuId, stock: 10, skuCode: 'TEST-SKU' };

    beforeEach(() => {
      // 默认 mock: 购物车存在
      prisma.cart.findUnique.mockResolvedValue(mockCart);
    });

    it('should add new item to cart', async () => {
      prisma.sku.findUnique.mockResolvedValue(mockSku);
      prisma.cartItem.findUnique.mockResolvedValue(null); // Item 不存在
      prisma.cartItem.create.mockResolvedValue({
        id: 'item-1',
        cartId: mockCart.id,
        skuId,
        quantity,
      });

      const result = await service.addToCart(userId, { skuId, quantity });

      expect(prisma.cartItem.create).toHaveBeenCalledWith({
        data: { cartId: mockCart.id, skuId, quantity },
      });
      expect(result).toBeDefined();
    });

    it('should update quantity if item exists', async () => {
      prisma.sku.findUnique.mockResolvedValue(mockSku);
      const existingItem = { id: 'item-1', quantity: 3 };
      prisma.cartItem.findUnique.mockResolvedValue(existingItem);
      prisma.cartItem.update.mockResolvedValue({
        ...existingItem,
        quantity: 5,
      });

      await service.addToCart(userId, { skuId, quantity });

      expect(prisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    });

    it('should throw NotFoundException if SKU not found', async () => {
      prisma.sku.findUnique.mockResolvedValue(null);

      await expect(
        service.addToCart(userId, { skuId, quantity }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if stock insufficient (new item)', async () => {
      prisma.sku.findUnique.mockResolvedValue({ ...mockSku, stock: 1 }); // 库存只有1

      await expect(
        service.addToCart(userId, { skuId, quantity: 2 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if stock insufficient (existing item)', async () => {
      prisma.sku.findUnique.mockResolvedValue(mockSku); // 库存10
      prisma.cartItem.findUnique.mockResolvedValue({
        id: 'item-1',
        quantity: 9,
      }); // 已有9个

      // 再加2个 = 11 > 10
      await expect(
        service.addToCart(userId, { skuId, quantity: 2 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateCartItem', () => {
    const userId = 'user-1';
    const itemId = 'item-1';
    const quantity = 5;

    it('should update item quantity', async () => {
      const mockItem = {
        id: itemId,
        sku: { stock: 10 },
      };
      prisma.cartItem.findFirst.mockResolvedValue(mockItem);
      prisma.cartItem.update.mockResolvedValue({ ...mockItem, quantity });

      const result = await service.updateCartItem(userId, itemId, { quantity });
      expect(prisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: itemId },
        data: { quantity },
      });
    });

    it('should throw NotFoundException if item not found or not owned by user', async () => {
      prisma.cartItem.findFirst.mockResolvedValue(null);

      await expect(
        service.updateCartItem(userId, itemId, { quantity }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if stock insufficient', async () => {
      const mockItem = {
        id: itemId,
        sku: { stock: 3 }, // 库存只有3
      };
      prisma.cartItem.findFirst.mockResolvedValue(mockItem);

      await expect(
        service.updateCartItem(userId, itemId, { quantity: 5 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeCartItem', () => {
    const userId = 'user-1';
    const itemId = 'item-1';

    it('should remove item', async () => {
      prisma.cartItem.findFirst.mockResolvedValue({ id: itemId });
      prisma.cartItem.delete.mockResolvedValue({ id: itemId });

      await service.removeCartItem(userId, itemId);
      expect(prisma.cartItem.delete).toHaveBeenCalledWith({
        where: { id: itemId },
      });
    });

    it('should throw NotFoundException if item not found', async () => {
      prisma.cartItem.findFirst.mockResolvedValue(null);

      await expect(service.removeCartItem(userId, itemId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('clearCart', () => {
    it('should clear all items in cart', async () => {
      const userId = 'user-1';
      const mockCart = { id: 'cart-1', userId };
      prisma.cart.findUnique.mockResolvedValue(mockCart);

      await service.clearCart(userId);
      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cartId: mockCart.id },
      });
    });

    it('should do nothing if cart not found', async () => {
      prisma.cart.findUnique.mockResolvedValue(null);
      await service.clearCart('user-1');
      expect(prisma.cartItem.deleteMany).not.toHaveBeenCalled();
    });
  });
});
