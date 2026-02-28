import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取或创建购物车
   * @param userId 用户 ID
   * @returns 购物车对象（包含商品项详情）
   */
  async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            sku: {
              include: {
                product: {
                  select: {
                    title: true,
                    images: true,
                    basePrice: true,
                  },
                },
                attributeValues: {
                  include: {
                    attributeValue: {
                      include: {
                        attribute: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              sku: {
                include: {
                  product: {
                    select: {
                      title: true,
                      images: true,
                      basePrice: true,
                    },
                  },
                  attributeValues: {
                    include: {
                      attributeValue: {
                        include: {
                          attribute: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });
    }

    return cart;
  }

  /**
   * 添加商品到购物车
   * @param userId 用户 ID
   * @param dto 添加商品参数（skuId, quantity）
   * @returns 更新后的购物车项
   */
  async addToCart(userId: string, dto: AddToCartDto) {
    const { skuId, quantity } = dto;

    // 1. 检查 SKU 是否存在且库存充足
    const sku = await this.prisma.sku.findUnique({
      where: { id: skuId },
    });

    if (!sku) {
      throw new NotFoundException('SKU not found');
    }

    if (sku.stock < quantity) {
      throw new BadRequestException(
        `Insufficient stock for SKU ${sku.skuCode}. Available: ${sku.stock}`,
      );
    }

    // 2. 获取或创建购物车
    const cart = await this.getOrCreateCart(userId);

    // 3. 检查购物车中是否已存在该商品
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_skuId: {
          cartId: cart.id,
          skuId,
        },
      },
    });

    if (existingItem) {
      // 检查增加后的总数量是否超库存
      if (sku.stock < existingItem.quantity + quantity) {
        throw new BadRequestException(
          `Insufficient stock. You already have ${existingItem.quantity} in cart, adding ${quantity} more exceeds stock limit ${sku.stock}.`,
        );
      }

      // 更新数量
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      // 创建新条目
      return this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          skuId,
          quantity,
        },
      });
    }
  }

  /**
   * 更新购物车商品数量
   * @param userId 用户 ID
   * @param itemId 购物车项 ID
   * @param dto 更新参数（quantity）
   * @returns 更新后的购物车项
   */
  async updateCartItem(
    userId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ) {
    const { quantity } = dto;

    // 1. 验证该 Item 是否属于当前用户的购物车
    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: { userId },
      },
      include: { sku: true },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    // 2. 检查库存
    if (item.sku.stock < quantity) {
      throw new BadRequestException(
        `Insufficient stock. Requested: ${quantity}, Available: ${item.sku.stock}`,
      );
    }

    // 3. 更新数量
    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  }

  /**
   * 删除购物车项
   * @param userId 用户 ID
   * @param itemId 购物车项 ID
   */
  async removeCartItem(userId: string, itemId: string) {
    // 验证归属权
    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: { userId },
      },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    return this.prisma.cartItem.delete({
      where: { id: itemId },
    });
  }

  /**
   * 清空购物车
   * @param userId 用户 ID
   */
  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) return;

    return this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
  }
}
