import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailTemplates } from '../email/email.templates';
import PDFDocument from 'pdfkit';

import { UpdateOrderDto } from './dto/update-order.dto';

import { BANK_INFO } from '../common/constants/payment-info';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * 生成形式发票 (PI) PDF
   *
   * 形式发票 (PI) 是在发货或交付货物之前发送给买方的初步销售清单。
   * 它描述了购买的商品以及其他重要信息，如运输重量和运输费用。
   *
   * @param id 订单 ID
   * @param user 请求用户 (用于权限检查)
   * @returns 包含 PDF 数据的 Buffer
   */
  async generatePi(id: string, user: any): Promise<Buffer> {
    const companyId =
      user.role === 'PLATFORM_ADMIN' ? undefined : user.companyId;
    const order = await this.findOne(id, companyId);

    return new Promise((resolve, reject) => {
      // Create PDF Document (A4 Size)
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // --- Header Section ---
      doc.fontSize(20).text('Proforma Invoice', { align: 'center' });
      doc.moveDown();

      // --- Info Section ---
      doc.fontSize(10);
      doc.text(`Order No: ${order.orderNo}`, { align: 'right' });
      doc.text(`Type: ${order.type || 'STANDARD'}`, { align: 'right' });
      doc.text(`Date: ${order.createdAt.toISOString().split('T')[0]}`, {
        align: 'right',
      });
      doc.text(`Status: ${order.status}`, { align: 'right' });
      doc.moveDown();

      // --- Buyer Info ---
      doc.font('Helvetica-Bold').text('Buyer:', 50, doc.y);
      doc.font('Helvetica').text(order.company.name, 100, doc.y - 12);
      if (order.company.address) doc.text(order.company.address, 100);
      if (order.company.contactEmail) doc.text(order.company.contactEmail, 100);

      if (
        order.consigneeName ||
        order.consigneeAddress1 ||
        order.consigneeCity ||
        order.consigneeCountry
      ) {
        doc.moveDown();
        doc.font('Helvetica-Bold').text('Consignee:', 50, doc.y);
        doc.font('Helvetica');
        const baseY = doc.y - 12;
        if (order.consigneeName) {
          doc.text(order.consigneeName, 100, baseY);
        }
        const line1Parts = [
          order.consigneeAddress1 || '',
          order.consigneeAddress2 || '',
        ].filter(Boolean);
        if (line1Parts.length) {
          doc.text(line1Parts.join(', '), 100);
        }
        const line2Parts = [
          order.consigneeCity || '',
          order.consigneeState || '',
          order.consigneePostalCode || '',
        ].filter(Boolean);
        if (line2Parts.length) {
          doc.text(line2Parts.join(', '), 100);
        }
        if (order.consigneeCountry) {
          doc.text(order.consigneeCountry, 100);
        }
        if (order.consigneePhone) {
          doc.text(order.consigneePhone, 100);
        }
      }

      doc.moveDown(2);

      // --- Table Layout Configuration ---
      // Define X coordinates for each column to ensure alignment
      const startY = doc.y;
      const colX = {
        product: 50,
        sku: 180,
        qty: 350,
        price: 400,
        total: 480,
      };

      doc.font('Helvetica-Bold');
      doc.text('Product', colX.product, startY);
      doc.text('SKU / Specs', colX.sku, startY);
      doc.text('Qty', colX.qty, startY);
      doc.text('Unit Price', colX.price, startY);
      doc.text('Total', colX.total, startY);

      // Draw Header Line
      doc
        .moveTo(50, startY + 15)
        .lineTo(550, startY + 15)
        .stroke();

      let y = startY + 25;
      doc.font('Helvetica');

      // --- Render Items ---
      order.items.forEach((item) => {
        // Page Break Logic: If we are near bottom (700px), add new page
        if (y > 700) {
          doc.addPage();
          y = 50; // Reset Y to top margin
        }

        const productName = item.productName;
        const specs = item.skuSpecs || '-';
        const currency = order.currency || 'USD';

        doc.text(productName.substring(0, 30), colX.product, y);
        doc.text(specs.substring(0, 30), colX.sku, y);
        doc.text(item.quantity.toString(), colX.qty, y);
        doc.text(`${currency} ${Number(item.unitPrice).toFixed(2)}`, colX.price, y);
        doc.text(`${currency} ${Number(item.totalPrice).toFixed(2)}`, colX.total, y);

        y += 20; // Move down for next row
      });

      doc.moveDown(2);
      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 10;

      // Totals
      const currency = order.currency || 'USD';
      doc.font('Helvetica-Bold');
      doc.text(
        `Total Amount: ${currency} ${Number(order.totalAmount).toFixed(2)}`,
        350,
        y,
        { align: 'right', width: 200 },
      );

      // Payment Terms (Bank Info - Configurable)
      doc.moveDown(4);
      doc.text('Payment Terms:', 50);
      doc.font('Helvetica').fontSize(9);
      doc.text(`Bank: ${BANK_INFO.bankName}`);
      doc.text(`Account Name: ${BANK_INFO.accountName}`);
      doc.text(`Account No: ${BANK_INFO.accountNo}`);
      doc.text(`Swift Code: ${BANK_INFO.swiftCode}`);
      if (BANK_INFO.address) {
        doc.text(`Bank Address: ${BANK_INFO.address}`);
      }

      doc.end();
    });
  }

  /**
   * 生成商业发票 (CI) PDF
   *
   * 商业发票 (CI) 是用于海关申报的主要单证。
   * 与 PI 不同，CI 必须包含 HS 编码、原产国和确切的贸易条款 (Incoterms)。
   *
   * @param id 订单 ID
   * @param user 请求用户
   */
  async generateCi(id: string, user: any): Promise<Buffer> {
    const companyId =
      user.role === 'PLATFORM_ADMIN' ? undefined : user.companyId;
    const order = await this.findOne(id, companyId);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // --- Header ---
      doc.fontSize(20).text('Commercial Invoice', { align: 'center' });
      doc.moveDown();

      // --- Document Info ---
      doc.fontSize(10);
      doc.text(`Invoice No: CI-${order.orderNo}`, { align: 'right' });
      doc.text(`Type: ${order.type || 'STANDARD'}`, { align: 'right' });
      doc.text(`Date: ${new Date().toISOString().split('T')[0]}`, {
        align: 'right',
      });
      doc.text(`Order No: ${order.orderNo}`, { align: 'right' });

      // Trade Terms (Crucial for Customs)
      if (order.incoterms) {
        doc.text(`Incoterms: ${order.incoterms}`, { align: 'right' });
      }
      if (order.portOfLoading) {
        doc.text(`Port of Loading: ${order.portOfLoading}`, { align: 'right' });
      }
      if (order.portOfDestination) {
        doc.text(`Port of Destination: ${order.portOfDestination}`, {
          align: 'right',
        });
      }

      doc.moveDown();

      // --- Seller Info ---
      doc.font('Helvetica-Bold').text('Seller:', 50, doc.y);
      doc.font('Helvetica').text('SoleTrade Inc.', 100, doc.y - 12);
      doc.text('123 Innovation Dr, Tech City', 100);
      doc.text('support@soletrade.com', 100);
      doc.moveDown();

      // --- Buyer Info ---
      doc.font('Helvetica-Bold').text('Buyer:', 50, doc.y);
      doc.font('Helvetica').text(order.company.name, 100, doc.y - 12);
      if (order.company.address) doc.text(order.company.address, 100);
      if (order.company.contactEmail) doc.text(order.company.contactEmail, 100);

      if (
        order.consigneeName ||
        order.consigneeAddress1 ||
        order.consigneeCity ||
        order.consigneeCountry
      ) {
        doc.moveDown();
        doc.font('Helvetica-Bold').text('Consignee:', 50, doc.y);
        doc.font('Helvetica');
        const baseY = doc.y - 12;
        if (order.consigneeName) {
          doc.text(order.consigneeName, 100, baseY);
        }
        const line1Parts = [
          order.consigneeAddress1 || '',
          order.consigneeAddress2 || '',
        ].filter(Boolean);
        if (line1Parts.length) {
          doc.text(line1Parts.join(', '), 100);
        }
        const line2Parts = [
          order.consigneeCity || '',
          order.consigneeState || '',
          order.consigneePostalCode || '',
        ].filter(Boolean);
        if (line2Parts.length) {
          doc.text(line2Parts.join(', '), 100);
        }
        if (order.consigneeCountry) {
          doc.text(order.consigneeCountry, 100);
        }
        if (order.consigneePhone) {
          doc.text(order.consigneePhone, 100);
        }
      }

      doc.moveDown(2);
      // Mandatory for Export
      doc.text('Country of Origin: China', 50);
      doc.moveDown(1);

      // --- Table Layout ---
      const startY = doc.y;
      const colX = {
        product: 50,
        sku: 180,
        hsCode: 280, // HS Code Column (Required for Customs)
        qty: 350,
        price: 400,
        total: 480,
      };

      doc.font('Helvetica-Bold');
      doc.text('Product', colX.product, startY);
      doc.text('SKU / Specs', colX.sku, startY);
      doc.text('HS Code', colX.hsCode, startY);
      doc.text('Qty', colX.qty, startY);
      doc.text('Unit Price', colX.price, startY);
      doc.text('Total', colX.total, startY);

      doc
        .moveTo(50, startY + 15)
        .lineTo(550, startY + 15)
        .stroke();

      let y = startY + 25;
      doc.font('Helvetica');

      order.items.forEach((item: any) => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }

        const productName = item.productName;
        const specs = item.skuSpecs || '-';
        // Get HS Code from Product (via OrderItem relation)
        const hsCode = item.product?.hsCode || '-';
        const currency = order.currency || 'USD';

        doc.text(productName.substring(0, 25), colX.product, y);
        doc.text(specs.substring(0, 25), colX.sku, y);
        doc.text(hsCode, colX.hsCode, y);
        doc.text(item.quantity.toString(), colX.qty, y);
        doc.text(`${currency} ${Number(item.unitPrice).toFixed(2)}`, colX.price, y);
        doc.text(`${currency} ${Number(item.totalPrice).toFixed(2)}`, colX.total, y);

        y += 20;
      });

      doc.moveDown(2);
      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 10;

      // Totals
      const currency = order.currency || 'USD';
      doc.font('Helvetica-Bold');
      doc.text(
        `Total Amount: ${currency} ${Number(order.totalAmount).toFixed(2)}`,
        350,
        y,
        { align: 'right', width: 200 },
      );

      doc.end();
    });
  }

  async generatePl(id: string, user: any): Promise<Buffer> {
    const companyId =
      user.role === 'PLATFORM_ADMIN' ? undefined : user.companyId;
    const order = await this.findOne(id, companyId);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('Packing List', { align: 'center' });
      doc.moveDown();

      // Info Section
      doc.fontSize(10);
      doc.text(`PL No: PL-${order.orderNo}`, { align: 'right' });
      doc.text(`Type: ${order.type || 'STANDARD'}`, { align: 'right' });
      doc.text(`Date: ${new Date().toISOString().split('T')[0]}`, {
        align: 'right',
      });
      doc.text(`Order No: ${order.orderNo}`, { align: 'right' });
      doc.moveDown();

      doc.font('Helvetica-Bold').text('Consignee:', 50, doc.y);
      doc.font('Helvetica');
      const consigneeBaseY = doc.y - 12;
      if (
        order.consigneeName ||
        order.consigneeAddress1 ||
        order.consigneeCity ||
        order.consigneeCountry
      ) {
        if (order.consigneeName) {
          doc.text(order.consigneeName, 100, consigneeBaseY);
        }
        const line1Parts = [
          order.consigneeAddress1 || '',
          order.consigneeAddress2 || '',
        ].filter(Boolean);
        if (line1Parts.length) {
          doc.text(line1Parts.join(', '), 100);
        }
        const line2Parts = [
          order.consigneeCity || '',
          order.consigneeState || '',
          order.consigneePostalCode || '',
        ].filter(Boolean);
        if (line2Parts.length) {
          doc.text(line2Parts.join(', '), 100);
        }
        if (order.consigneeCountry) {
          doc.text(order.consigneeCountry, 100);
        }
        if (order.consigneePhone) {
          doc.text(order.consigneePhone, 100);
        }
      } else {
        doc.text(order.company.name, 100, consigneeBaseY);
        if (order.company.address) {
          doc.text(order.company.address, 100);
        }
      }

      doc.moveDown(2);

      // Shipping Marks
      if (order.shippingMarks) {
        doc.font('Helvetica-Bold').text('Shipping Marks:', 50);
        doc.font('Helvetica').text(order.shippingMarks, 50);
        doc.moveDown();
      }

      // Table Header
      const startY = doc.y;
      const colX = {
        product: 50,
        sku: 180,
        qty: 320,
        cartons: 380,
        weight: 440,
        cbm: 500,
      };

      doc.font('Helvetica-Bold');
      doc.text('Product', colX.product, startY);
      doc.text('SKU / Specs', colX.sku, startY);
      doc.text('Qty', colX.qty, startY);
      doc.text('Ctns', colX.cartons, startY);
      doc.text('G.W(kg)', colX.weight, startY);
      doc.text('CBM', colX.cbm, startY);

      doc
        .moveTo(50, startY + 15)
        .lineTo(550, startY + 15)
        .stroke();

      let y = startY + 25;
      doc.font('Helvetica');

      let totalQty = 0;
      let totalCartons = 0;
      let totalGw = 0;
      let totalCbm = 0;

      order.items.forEach((item: any) => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }

        const productName = item.productName;
        const specs = item.skuSpecs || '-';

        // Logistics Calculation
        const itemsPerCarton = item.sku?.itemsPerCarton || 1; // Default to 1 if not set
        const cartons = Math.ceil(item.quantity / itemsPerCarton);

        // Weight: Gross Weight per item * Qty
        const unitGw = item.sku?.grossWeight ? Number(item.sku.grossWeight) : 0;
        const gw = (item.quantity * unitGw).toFixed(2);

        // Volume: (L*W*H / 1,000,000) * Cartons
        let cbm = 0;
        if (item.sku?.length && item.sku?.width && item.sku?.height) {
          const volPerCarton =
            (Number(item.sku.length) *
              Number(item.sku.width) *
              Number(item.sku.height)) /
            1000000;
          cbm = volPerCarton * cartons;
        }
        const cbmStr = cbm.toFixed(3);

        doc.text(productName.substring(0, 25), colX.product, y);
        doc.text(specs.substring(0, 25), colX.sku, y);
        doc.text(item.quantity.toString(), colX.qty, y);
        doc.text(cartons.toString(), colX.cartons, y);
        doc.text(gw, colX.weight, y);
        doc.text(cbmStr, colX.cbm, y);

        totalQty += item.quantity;
        totalCartons += cartons;
        totalGw += Number(gw);
        totalCbm += cbm;

        y += 20;
      });

      doc.moveDown(2);
      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 10;

      // Summary
      doc.font('Helvetica-Bold');
      doc.text('TOTAL:', 50, y);
      doc.text(totalQty.toString(), colX.qty, y);
      doc.text(totalCartons.toString(), colX.cartons, y);
      doc.text(totalGw.toFixed(2), colX.weight, y);
      doc.text(totalCbm.toFixed(3), colX.cbm, y);

      doc.end();
    });
  }

  async createFromInquiry(createOrderDto: CreateOrderDto) {
    const { inquiryId } = createOrderDto;
    if (!inquiryId) {
      throw new BadRequestException(
        'Inquiry ID is required for admin creation',
      );
    }
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id: inquiryId },
    });
    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    // Find the user associated with the inquiry email
    const user = await this.prisma.user.findUnique({
      where: { email: inquiry.contactEmail },
    });

    if (!user) {
      throw new BadRequestException(
        `No registered user found for email: ${inquiry.contactEmail}. User must be registered to create an order.`,
      );
    }

    const companyId = inquiry.companyId || user.companyId;
    if (!companyId) {
      throw new BadRequestException(
        'Company information is missing for this inquiry/user.',
      );
    }

    return this.create(user.id, companyId, createOrderDto);
  }

  /**
   * 🔒 事务性订单创建
   *
   * 此方法实现了具有 ACID 保证的核心 B2B 交易逻辑：
   * 1. 🛡️ 库存检查：悲观地检查实时库存。
   * 2. 📉 库存扣减：原子性地扣减库存以防止超卖。
   * 3. 💰 后端计价：忽略前端价格，根据数据库值重新计算。
   * 4. 📊 阶梯定价：根据数量自动应用批量折扣。
   *
   * @param userId 买家 ID
   * @param companyId 买家公司 ID
   * @param createOrderDto 订单数据
   * @returns 创建的订单
   */
  async create(
    userId: string,
    companyId: string,
    createOrderDto: CreateOrderDto,
  ) {
    const {
      inquiryId,
      items,
      type = 'STANDARD',
      consigneeName,
      consigneePhone,
      consigneeCountry,
      consigneeState,
      consigneeCity,
      consigneePostalCode,
      consigneeAddress1,
      consigneeAddress2,
    } = createOrderDto;

    // Generate Order No (Format: ORD-YYYYMMDD-RRR)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    const orderNo = `ORD-${dateStr}-${randomSuffix}`;

    // Start Database Transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Validate Inquiry if provided (Ensure it belongs to this company)
      if (inquiryId) {
        const inquiry = await tx.inquiry.findUnique({
          where: { id: inquiryId },
        });

        if (!inquiry) {
          throw new NotFoundException('Inquiry not found');
        }

        if (inquiry.companyId !== companyId) {
          throw new NotFoundException('Inquiry not found for this company');
        }
      }

      // 1. Validate & Calculate Items (Backend Pricing & Stock Check)
      let calculatedTotalAmount = 0;
      const orderItemsData: Prisma.OrderItemUncheckedCreateWithoutOrderInput[] =
        [];

      for (const item of items) {
        if (!item.skuId) {
          throw new BadRequestException('SKU ID is required for order items');
        }

        // Fetch SKU to get real price and stock (Locking strategy relies on Prisma default isolation)
        const sku = await tx.sku.findUnique({
          where: { id: item.skuId },
          include: { product: true },
        });

        if (!sku) {
          throw new NotFoundException(`SKU not found: ${item.skuId}`);
        }

        if (sku.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for SKU: ${sku.skuCode} (Requested: ${item.quantity}, Available: ${sku.stock})`,
          );
        }

        // Atomic Decrement (Prevents race conditions)
        await tx.sku.update({
          where: { id: sku.id },
          data: { stock: { decrement: item.quantity } },
        });

        const unitPrice = Number(sku.price);

        const totalPrice = unitPrice * item.quantity;
        calculatedTotalAmount += totalPrice;

        let productName = 'Product';
        try {
          productName = sku.product.title
            ? JSON.parse(sku.product.title).en
            : 'Product';
        } catch (e) {
          productName = sku.product.title || 'Product';
        }

        orderItemsData.push({
          productId: item.productId,
          skuId: item.skuId,
          productName, // Source of Truth: DB
          skuSpecs: item.skuSpecs, // Note: Specs string is currently from frontend, consider reconstructing from DB attributes for stricter consistency
          quantity: item.quantity,
          unitPrice: new Prisma.Decimal(unitPrice), // Source of Truth: Backend Calculation
          totalPrice: new Prisma.Decimal(totalPrice),
        });
      }

      // Create Order with backend-calculated total
      const newOrder = await tx.order.create({
        data: {
          orderNo,
          companyId,
          userId,
          inquiryId,
          type,
          totalAmount: calculatedTotalAmount,
          status: 'PENDING_PAYMENT',
          consigneeName,
          consigneePhone,
          consigneeCountry,
          consigneeState,
          consigneeCity,
          consigneePostalCode,
          consigneeAddress1,
          consigneeAddress2,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: true,
        },
      });

      // If linked to inquiry, update inquiry status
      if (inquiryId) {
        await tx.inquiry.update({
          where: { id: inquiryId },
          data: { status: 'ORDERED' },
        });
      }

      return newOrder;
    });

    // Notify Admin
    try {
      await this.notificationsService.notifyAdmin(
        'ORDER',
        `New Order Received: ${order.orderNo}`,
        EmailTemplates.adminNewOrder(order.orderNo, Number(order.totalAmount)),
        order.id,
        'ORDER',
      );
    } catch (error) {
      console.error('Failed to send admin notification:', error);
    }

    // Notify User
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user && user.email) {
        await this.notificationsService.notifyUser(
          userId,
          user.email,
          'ORDER',
          `Order Confirmation: ${order.orderNo}`,
          EmailTemplates.orderConfirmation(
            user.fullName || 'Customer',
            order.orderNo,
            Number(order.totalAmount),
          ),
          order.id,
          'ORDER',
        );
      }
    } catch (error) {
      console.error('Failed to send user notification:', error);
    }

    return order;
  }

  async findAll(companyId: string) {
    return this.prisma.order.findMany({
      where: { companyId },
      include: {
        items: true,
        inquiry: {
          select: { inquiryNo: true },
        },
        company: {
          select: {
            name: true,
            contactEmail: true,
            address: true,
          },
        },
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllForAdmin() {
    return this.prisma.order.findMany({
      include: {
        items: true,
        company: {
          select: { name: true, contactEmail: true },
        },
        user: {
          select: { fullName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    const order = await this.prisma.order.update({
      where: { id },
      data: {
        ...updateOrderDto,
      },
      include: {
        user: {
          select: { id: true, email: true, fullName: true },
        },
      },
    });

    // If status changed, notify user (reuse existing logic if status is present)
    if (updateOrderDto.status && order.user?.email) {
      await this.notificationsService.notifyUser(
        order.user.id,
        order.user.email,
        'ORDER',
        `Order Status Update: ${order.orderNo}`,
        EmailTemplates.orderStatusUpdate(
          order.user.fullName || 'Customer',
          order.orderNo,
          updateOrderDto.status,
          order.id,
        ),
        order.id,
        'ORDER',
      );
    }

    return order;
  }

  /**
   * 更新订单状态并处理库存回滚逻辑
   *
   * 处理状态转换和副作用：
   * - CANCELLED: 自动将库存释放回 SKU。
   * - SHIPPED/DELIVERED: 触发通知。
   *
   * @param id 订单 ID
   * @param status 新状态
   */
  async updateStatus(id: string, status: string) {
    // Wrap in transaction to ensure inventory rollback is atomic with status change
    const order = await this.prisma.$transaction(async (tx) => {
      // 1. Get current order status
      const currentOrder = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!currentOrder) {
        throw new NotFoundException('Order not found');
      }

      // 2. Handle Inventory Rollback
      // If cancelling an order that was not already cancelled, we return stock.
      if (status === 'CANCELLED' && currentOrder.status !== 'CANCELLED') {
        for (const item of currentOrder.items) {
          if (item.skuId) {
            await tx.sku.update({
              where: { id: item.skuId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
      }

      // NOTE: Re-opening a cancelled order is currently NOT supported automatically.
      // If manually re-opening, stock must be checked and decremented manually.

      // 3. Update Status
      const updatedOrder = await tx.order.update({
        where: { id },
        data: { status },
        include: {
          user: {
            select: { id: true, email: true, fullName: true },
          },
        },
      });

      return updatedOrder;
    });

    // Notify User
    if (order.user?.email) {
      await this.notificationsService.notifyUser(
        order.user.id,
        order.user.email,
        'ORDER',
        `Order Status Update: ${order.orderNo}`,
        EmailTemplates.orderStatusUpdate(
          order.user.fullName || 'Customer',
          order.orderNo,
          status,
          order.id,
        ),
        order.id,
        'ORDER',
      );
    }

    return order;
  }

  async findOne(id: string, companyId?: string) {
    const whereClause: { id: string; companyId?: string } = { id };
    if (companyId) {
      whereClause.companyId = companyId;
    }

    const order = await this.prisma.order.findFirst({
      where: whereClause,
      include: {
        items: {
          include: {
            product: true,
            sku: true,
          },
        },
        inquiry: true,
        shippings: true,
        payments: true,
        company: {
          select: { name: true, address: true, contactEmail: true },
        },
        user: {
          select: { fullName: true, email: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }
}
