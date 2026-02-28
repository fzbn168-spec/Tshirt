import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  CreateRetailOrderDto,
  UpdateRetailOrderStatusDto,
} from './dto/retail-order.dto';
import { getBankInfo, getWesternUnionInfo } from '../common/constants/payment-info';

@Injectable()
export class RetailOrderService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建零售订单
   * @param userId 用户ID
   * @param dto 创建订单参数
   */
  async createOrder(userId: string, dto: CreateRetailOrderDto) {
    const { shippingAddress, paymentMethod, customRequests } = dto;

    // 1. 获取用户购物车
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            sku: {
              include: {
                product: true, // 获取产品信息（可能包含基础价格等）
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // 2. 检查库存并计算总价
    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of cart.items) {
      // 2.1 检查库存
      if (item.sku.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for SKU ${item.sku.skuCode}`,
        );
      }

      // 2.2 计算单价（考虑阶梯价）
      let unitPrice = Number(item.sku.retailPrice);
      
      // 如果没有零售价，尝试使用批发价逻辑（如果有的话，这里简化为必须有零售价）
      if (!unitPrice) {
         // 这里可以增加容错，比如 fallback 到 product.basePrice
         unitPrice = Number(item.sku.product.basePrice);
      }
      
      // 解析阶梯价 (如果有)
      if (item.sku.wholesalePrices) {
        try {
          const tiers = JSON.parse(item.sku.wholesalePrices);
          if (Array.isArray(tiers)) {
            // 按数量从大到小排序，找到符合当前数量的最低价
            const matchedTier = tiers
              .sort((a, b) => b.minQty - a.minQty)
              .find((t) => item.quantity >= t.minQty);
            
            if (matchedTier) {
              unitPrice = Number(matchedTier.price);
            }
          }
        } catch (e) {
          // JSON 解析失败，忽略阶梯价
        }
      }

      const lineTotal = unitPrice * item.quantity;
      totalAmount += lineTotal;

      orderItemsData.push({
        skuId: item.skuId,
        quantity: item.quantity,
        unitPrice: unitPrice,
        totalPrice: lineTotal,
      });
    }

    // 3. 事务执行：创建订单、创建订单项、扣减库存、清空购物车
    const order = await this.prisma.$transaction(async (tx) => {
      // 3.1 生成唯一订单号
      const orderNo = `RO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // 3.2 创建订单头
      const newOrder = await tx.retailOrder.create({
        data: {
          orderNo,
          userId,
          totalAmount,
          currency: 'USD', // 默认 USD
          paymentMethod,
          paymentStatus: 'PENDING',
          orderStatus: 'PROCESSING',
          shippingAddress: JSON.stringify(shippingAddress),
          customRequests: customRequests ? JSON.stringify(customRequests) : null,
        },
      });

      // 3.3 创建订单项
      for (const itemData of orderItemsData) {
        await tx.retailOrderItem.create({
          data: {
            retailOrderId: newOrder.id,
            skuId: itemData.skuId,
            quantity: itemData.quantity,
            unitPrice: itemData.unitPrice,
            totalPrice: itemData.totalPrice,
          },
        });

        // 3.4 扣减库存
        await tx.sku.update({
          where: { id: itemData.skuId },
          data: {
            stock: { decrement: itemData.quantity },
            soldCount: { increment: itemData.quantity }, // 增加 SKU 销量（如果 Schema 有这个字段的话，目前 Schema 没有，先忽略）
          },
        });
        
        // 增加 Product 销量
        const sku = cart.items.find(i => i.skuId === itemData.skuId).sku;
        await tx.product.update({
             where: { id: sku.productId },
             data: { soldCount: { increment: itemData.quantity } }
        });
      }

      // 3.5 清空购物车
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    // 4. 返回订单详情及支付信息
    let paymentInfo = null;
    if (paymentMethod === 'BANK_TRANSFER') {
      paymentInfo = getBankInfo();
    } else if (paymentMethod === 'WESTERN_UNION') {
      paymentInfo = getWesternUnionInfo();
    }

    return {
      ...order,
      paymentInfo,
    };
  }

  /**
   * 获取订单列表（分页）
   * @param userId 用户ID (可选，若不传则查询所有，仅管理员)
   * @param page 页码
   * @param limit 每页数量
   * @param status 状态筛选 (可选)
   */
  async getOrders(
    userId?: string,
    page: number = 1,
    limit: number = 10,
    status?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.orderStatus = status;
    }

    const [orders, total] = await Promise.all([
      this.prisma.retailOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              sku: {
                select: { skuCode: true, specs: true, image: true },
              },
            },
          },
        },
      }),
      this.prisma.retailOrder.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 获取订单详情
   * @param orderId 订单ID
   * @param userId 用户ID (用于权限验证，管理员可传 null)
   */
  async getOrderById(orderId: string, userId?: string) {
    const order = await this.prisma.retailOrder.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            sku: {
              include: {
                product: { select: { title: true, images: true } },
              },
            },
          },
        },
        shipments: true,
        user: { select: { fullName: true, email: true } }, // 包含买家信息
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // 权限检查
    if (userId && order.userId !== userId) {
      throw new NotFoundException('Order not found'); // 避免泄露他人订单存在性
    }

    return order;
  }

  /**
   * 更新订单状态 (管理员)
   * @param orderId 订单ID
   * @param dto 更新参数
   */
  async updateOrderStatus(orderId: string, dto: UpdateRetailOrderStatusDto) {
    const order = await this.prisma.retailOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.retailOrder.update({
      where: { id: orderId },
      data: {
        ...dto,
      },
    });
  }
}
