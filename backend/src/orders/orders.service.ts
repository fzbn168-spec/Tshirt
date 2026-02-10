import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailTemplates } from '../email/email.templates';
import PDFDocument from 'pdfkit';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async generatePi(id: string, user: any): Promise<Buffer> {
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
      doc.fontSize(20).text('Proforma Invoice', { align: 'center' });
      doc.moveDown();

      // Info Section
      doc.fontSize(10);
      doc.text(`Order No: ${order.orderNo}`, { align: 'right' });
      doc.text(`Date: ${order.createdAt.toISOString().split('T')[0]}`, {
        align: 'right',
      });
      doc.text(`Status: ${order.status}`, { align: 'right' });
      doc.moveDown();

      // Buyer Info
      doc.font('Helvetica-Bold').text('Buyer:', 50, doc.y);
      doc.font('Helvetica').text(order.company.name, 100, doc.y - 12);
      if (order.company.address) doc.text(order.company.address, 100);
      if (order.company.contactEmail) doc.text(order.company.contactEmail, 100);

      doc.moveDown(2);

      // Table Header
      const startY = doc.y;
      const colX = { product: 50, sku: 200, qty: 350, price: 400, total: 480 };

      doc.font('Helvetica-Bold');
      doc.text('Product', colX.product, startY);
      doc.text('SKU / Specs', colX.sku, startY);
      doc.text('Qty', colX.qty, startY);
      doc.text('Unit Price', colX.price, startY);
      doc.text('Total', colX.total, startY);

      doc
        .moveTo(50, startY + 15)
        .lineTo(550, startY + 15)
        .stroke();

      let y = startY + 25;
      doc.font('Helvetica');

      order.items.forEach((item) => {
        // Handle page break
        if (y > 700) {
          doc.addPage();
          y = 50;
        }

        const productName = item.productName;
        const specs = item.skuSpecs || '-';

        doc.text(productName.substring(0, 30), colX.product, y);
        doc.text(specs.substring(0, 30), colX.sku, y);
        doc.text(item.quantity.toString(), colX.qty, y);
        doc.text(`$${Number(item.unitPrice).toFixed(2)}`, colX.price, y);
        doc.text(`$${Number(item.totalPrice).toFixed(2)}`, colX.total, y);

        y += 20;
      });

      doc.moveDown(2);
      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 10;

      // Totals
      doc.font('Helvetica-Bold');
      doc.text(
        `Total Amount: $${Number(order.totalAmount).toFixed(2)}`,
        350,
        y,
        { align: 'right', width: 200 },
      );

      // Payment Terms (Bank Info - Mock)
      doc.moveDown(4);
      doc.text('Payment Terms:', 50);
      doc.font('Helvetica').fontSize(9);
      doc.text('Bank: Bank of America');
      doc.text('Account Name: SoleTrade Inc.');
      doc.text('Account No: 1234567890');
      doc.text('Swift Code: BOFAUS3N');

      doc.end();
    });
  }

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

      // Header
      doc.fontSize(20).text('Commercial Invoice', { align: 'center' });
      doc.moveDown();

      // Info Section
      doc.fontSize(10);
      doc.text(`Invoice No: CI-${order.orderNo}`, { align: 'right' });
      doc.text(`Date: ${new Date().toISOString().split('T')[0]}`, {
        align: 'right',
      });
      doc.text(`Order No: ${order.orderNo}`, { align: 'right' });
      doc.moveDown();

      // Seller Info (Platform)
      doc.font('Helvetica-Bold').text('Seller:', 50, doc.y);
      doc.font('Helvetica').text('SoleTrade Inc.', 100, doc.y - 12);
      doc.text('123 Innovation Dr, Tech City', 100);
      doc.text('support@soletrade.com', 100);
      doc.moveDown();

      // Buyer Info
      doc.font('Helvetica-Bold').text('Buyer:', 50, doc.y);
      doc.font('Helvetica').text(order.company.name, 100, doc.y - 12);
      if (order.company.address) doc.text(order.company.address, 100);
      if (order.company.contactEmail) doc.text(order.company.contactEmail, 100);

      doc.moveDown(2);

      // Table Header
      const startY = doc.y;
      const colX = { product: 50, sku: 200, qty: 350, price: 400, total: 480 };

      doc.font('Helvetica-Bold');
      doc.text('Product', colX.product, startY);
      doc.text('SKU / Specs', colX.sku, startY);
      doc.text('Qty', colX.qty, startY);
      doc.text('Unit Price', colX.price, startY);
      doc.text('Total', colX.total, startY);

      doc
        .moveTo(50, startY + 15)
        .lineTo(550, startY + 15)
        .stroke();

      let y = startY + 25;
      doc.font('Helvetica');

      order.items.forEach((item) => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }

        const productName = item.productName;
        const specs = item.skuSpecs || '-';

        doc.text(productName.substring(0, 30), colX.product, y);
        doc.text(specs.substring(0, 30), colX.sku, y);
        doc.text(item.quantity.toString(), colX.qty, y);
        doc.text(`$${Number(item.unitPrice).toFixed(2)}`, colX.price, y);
        doc.text(`$${Number(item.totalPrice).toFixed(2)}`, colX.total, y);

        y += 20;
      });

      doc.moveDown(2);
      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 10;

      // Totals
      doc.font('Helvetica-Bold');
      doc.text(
        `Total Amount: $${Number(order.totalAmount).toFixed(2)}`,
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
      doc.text(`Date: ${new Date().toISOString().split('T')[0]}`, {
        align: 'right',
      });
      doc.text(`Order No: ${order.orderNo}`, { align: 'right' });
      doc.moveDown();

      // Buyer Info
      doc.font('Helvetica-Bold').text('Consignee:', 50, doc.y);
      doc.font('Helvetica').text(order.company.name, 100, doc.y - 12);
      if (order.company.address) doc.text(order.company.address, 100);
      
      doc.moveDown(2);

      // Table Header
      const startY = doc.y;
      const colX = { product: 50, sku: 200, qty: 350, cartons: 420, weight: 480 };

      doc.font('Helvetica-Bold');
      doc.text('Product', colX.product, startY);
      doc.text('SKU / Specs', colX.sku, startY);
      doc.text('Qty', colX.qty, startY);
      doc.text('Cartons', colX.cartons, startY);
      doc.text('G.W (kg)', colX.weight, startY);

      doc
        .moveTo(50, startY + 15)
        .lineTo(550, startY + 15)
        .stroke();

      let y = startY + 25;
      doc.font('Helvetica');

      let totalQty = 0;
      // Mock weight/carton logic since DB doesn't have it yet
      order.items.forEach((item) => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }

        const productName = item.productName;
        const specs = item.skuSpecs || '-';
        // Mock calculation: 20 items per carton, 0.5kg per item
        const cartons = Math.ceil(item.quantity / 20); 
        const weight = (item.quantity * 0.5).toFixed(1);

        doc.text(productName.substring(0, 30), colX.product, y);
        doc.text(specs.substring(0, 30), colX.sku, y);
        doc.text(item.quantity.toString(), colX.qty, y);
        doc.text(cartons.toString(), colX.cartons, y);
        doc.text(weight, colX.weight, y);

        totalQty += item.quantity;
        y += 20;
      });

      doc.moveDown(2);
      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 10;

      doc.font('Helvetica-Bold');
      doc.text(`Total Quantity: ${totalQty}`, 50, y);

      doc.end();
    });
  }

  async create(
    userId: string,
    companyId: string,
    createOrderDto: CreateOrderDto,
  ) {
    const { inquiryId, items } = createOrderDto;

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);

    // Generate Order No
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    const orderNo = `ORD-${dateStr}-${randomSuffix}`;

    const order = await this.prisma.$transaction(async (tx) => {
      // Validate Inquiry if provided
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

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNo,
          companyId,
          userId,
          inquiryId,
          totalAmount,
          status: 'PENDING_PAYMENT',
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              skuId: item.skuId,
              productName: item.productName,
              skuSpecs: item.skuSpecs,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
            })),
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
    await this.notificationsService.notifyAdmin(
      'ORDER',
      `New Order Received: ${order.orderNo}`,
      EmailTemplates.adminNewOrder(order.orderNo, Number(order.totalAmount)),
      order.id,
      'ORDER',
    );

    // Notify User
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

  async updateStatus(id: string, status: string) {
    const order = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: { id: true, email: true, fullName: true },
        },
      },
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
        items: true,
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
