import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  CreateInquiryDto,
  CreateInquiryItemDto,
} from './dto/create-inquiry.dto';
import { UpdateInquiryDto } from './dto/update-inquiry.dto';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailTemplates } from '../email/email.templates';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';

@Injectable()
export class InquiriesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * 创建新的询价单 (RFQ)
   *
   * 逻辑说明:
   * 1. 生成唯一的询价单号 (RFQ-YYYY-NNN)。
   * 2. 创建询价主表和明细表记录。
   * 3. 触发系统通知：告知平台管理员收到新询盘。
   *
   * @param createInquiryDto 询价单数据
   * @param companyId 关联公司ID (可选)
   */
  async create(createInquiryDto: CreateInquiryDto, companyId?: string) {
    const { items, message, ...inquiryData } = createInquiryDto;

    // 如果提供了 message 但没有 notes，将 message 作为 notes 存储
    // 因为 Inquiry 模型没有 message 字段，而 InquiryMessage 需要 senderId (登录用户)
    // 对于游客询盘，只能存入 notes
    if (message && !inquiryData.notes) {
      inquiryData.notes = message;
    }

    // 生成简易询价单号 (实际业务可能需要更复杂的生成规则)
    const count = await this.prisma.inquiry.count();
    const inquiryNo = `RFQ-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    // 预检：验证关联数据是否存在，避免 500 错误
    if (companyId) {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
      });
      if (!company) {
        throw new BadRequestException('关联的公司账户不存在，请尝试重新登录。');
      }
    }

    const productIds = [...new Set(items.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    });
    const foundProductIds = new Set(products.map((p) => p.id));
    const missingProductItem = items.find(
      (i) => !foundProductIds.has(i.productId),
    );

    if (missingProductItem) {
      throw new BadRequestException(
        `商品 '${missingProductItem.productName}' 已下架或不存在，请从购物车中移除。`,
      );
    }

    const skuIds = [
      ...new Set(items.map((i) => i.skuId).filter((id): id is string => !!id)),
    ];
    if (skuIds.length > 0) {
      const skus = await this.prisma.sku.findMany({
        where: { id: { in: skuIds } },
        select: { id: true },
      });
      const foundSkuIds = new Set(skus.map((s) => s.id));
      const missingSkuItem = items.find(
        (i) => i.skuId && !foundSkuIds.has(i.skuId),
      );

      if (missingSkuItem) {
        throw new BadRequestException(
          `商品 '${missingSkuItem.productName}' 的该规格已失效，请从购物车中移除。`,
        );
      }
    }

    try {
      const inquiry = await this.prisma.inquiry.create({
        data: {
          ...inquiryData,
          companyId,
          inquiryNo,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              skuId: item.skuId,
              skuSpecs: item.skuSpecs,
              quantity: item.quantity,
              targetPrice: item.price,
              quotedPrice: item.quotedPrice,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // 通知管理员
      try {
        await this.notificationsService.notifyAdmin(
          'INQUIRY',
          `New Inquiry Received: ${inquiry.inquiryNo}`,
          EmailTemplates.adminNewInquiry(
            inquiry.inquiryNo,
            inquiry.contactName || inquiry.contactEmail,
          ),
          inquiry.id,
          'INQUIRY',
        );
      } catch (error) {
        console.error('Failed to send admin notification:', error);
      }

      return inquiry;
    } catch (error) {
      console.error('Failed to create inquiry in database:', error);
      throw error;
    }
  }

  findAll(companyId?: string) {
    const where: Prisma.InquiryWhereInput = {};
    if (companyId) {
      where.companyId = companyId;
    }

    return this.prisma.inquiry.findMany({
      where,
      include: {
        items: true,
        company: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, companyId?: string) {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id },
      include: {
        items: true,
        company: true,
      },
    });

    if (!inquiry) {
      throw new NotFoundException(`Inquiry #${id} not found`);
    }

    if (companyId && inquiry.companyId !== companyId) {
      throw new ForbiddenException(
        'You do not have permission to view this inquiry',
      );
    }

    return inquiry;
  }

  /**
   * 更新询价单 (支持批量修改明细)
   *
   * 逻辑说明:
   * 1. 验证权限 (仅限所属公司或管理员)。
   * 2. 事务性更新:
   *    - 如果提供了 items，则采用"全量替换"策略 (删除旧明细 -> 插入新明细)。
   *    - 更新主表字段 (如状态、报价)。
   * 3. 状态流转通知:
   *    - 如果状态变为 QUOTED (已报价)，自动通知买家查看。
   *
   * @param id 询价单ID
   * @param updateInquiryDto 更新数据
   * @param companyId 请求者所属公司 (用于权限验证)
   */
  async update(
    id: string,
    updateInquiryDto: UpdateInquiryDto,
    companyId?: string,
  ) {
    // 验证存在性和权限
    const existing = await this.findOne(id, companyId);

    const { items, ...data } = updateInquiryDto;

    const updatedInquiry = await this.prisma.$transaction(async (prisma) => {
      if (items) {
        // 如果提供了明细，先删除旧明细，再创建新明细 (全量替换模式)
        await prisma.inquiryItem.deleteMany({ where: { inquiryId: id } });
        await prisma.inquiryItem.createMany({
          data: items.map((item) => ({
            inquiryId: id,
            productId: item.productId,
            productName: item.productName,
            skuId: item.skuId,
            skuSpecs: item.skuSpecs,
            quantity: item.quantity,
            targetPrice: item.price,
            quotedPrice: item.quotedPrice,
            paymentTerms: item.paymentTerms,
            quoteValidUntil: item.quoteValidUntil
              ? new Date(item.quoteValidUntil)
              : null,
          })),
        });
      }

      return prisma.inquiry.update({
        where: { id },
        data,
        include: { items: true },
      });
    });

    // 状态流转通知: 如果已报价 (QUOTED)
    if (data.status === 'QUOTED' && existing.status !== 'QUOTED') {
      // 尝试查找该公司下的用户进行通知
      // 如果是匿名询价，则仅发送邮件

      let userId: string | null = null;
      if (updatedInquiry.companyId) {
        // 查找公司下的第一个用户 (通常是管理员)
        const user = await this.prisma.user.findFirst({
          where: { companyId: updatedInquiry.companyId },
        });
        if (user) userId = user.id;
      }

      if (userId) {
        await this.notificationsService.notifyUser(
          userId,
          updatedInquiry.contactEmail,
          'INQUIRY',
          `Inquiry Quoted: ${updatedInquiry.inquiryNo}`,
          `<p>Your inquiry <strong>${updatedInquiry.inquiryNo}</strong> has been quoted. Please log in to review.</p>`,
          updatedInquiry.id,
          'INQUIRY',
        );
      } else {
        // 如果找不到用户 (匿名询价)，仅发送邮件
        await this.notificationsService.notifyEmailOnly(
          updatedInquiry.contactEmail,
          `Inquiry Quoted: ${updatedInquiry.inquiryNo}`,
          `<p>Your inquiry <strong>${updatedInquiry.inquiryNo}</strong> has been quoted. Check your email for details.</p>`,
        );
      }
    }

    return updatedInquiry;
  }

  async remove(id: string, companyId?: string) {
    await this.findOne(id, companyId);
    return this.prisma.inquiry.delete({
      where: { id },
    });
  }

  async importFromExcel(buffer: Buffer, user: any) {
    let workbook;
    try {
      workbook = XLSX.read(buffer, { type: 'buffer' });
    } catch (e) {
      throw new BadRequestException('Invalid Excel file');
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      throw new BadRequestException('Excel file is empty');
    }

    const items: CreateInquiryItemDto[] = [];
    const errors: string[] = [];

    // Pre-fetch all SKUs to optimize? For now, loop is fine for reasonable size.
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      // Flexible column names
      const skuCode = row['SkuCode'] || row['SKU'] || row['sku'] || row['Sku'];
      const quantity = row['Quantity'] || row['Qty'] || row['quantity'];
      const targetPrice =
        row['TargetPrice'] ||
        row['Price'] ||
        row['price'] ||
        row['Target Price'];

      if (!skuCode || !quantity) {
        errors.push(`Row ${i + 2}: Missing SKU or Quantity`); // i+2 because of header
        continue;
      }

      const sku = await this.prisma.sku.findUnique({
        where: { skuCode: String(skuCode) },
        include: { product: true },
      });

      if (!sku) {
        errors.push(`Row ${i + 2}: SKU '${skuCode}' not found`);
        continue;
      }

      items.push({
        productId: sku.productId,
        productName:
          typeof sku.product.title === 'string' &&
          sku.product.title.startsWith('{')
            ? JSON.parse(sku.product.title).en
            : sku.product.title,
        skuId: sku.id,
        skuSpecs: sku.specs,
        quantity: Number(quantity),
        price: targetPrice ? Number(targetPrice) : 0,
      });
    }

    if (errors.length > 0) {
      throw new BadRequestException(`Import failed:\n${errors.join('\n')}`);
    }

    if (items.length === 0) {
      throw new BadRequestException('No valid items found to import');
    }

    // Create Inquiry
    return this.create(
      {
        items,
        message: 'Imported from Excel',
        contactName: user.fullName || user.email,
        contactEmail: user.email,
      },
      user.companyId,
    );
  }

  async generatePdf(id: string, user: any): Promise<Buffer> {
    const companyId =
      user.role === 'PLATFORM_ADMIN' ? undefined : user.companyId;
    const inquiry = await this.findOne(id, companyId);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('Quotation / Inquiry Details', { align: 'center' });
      doc.moveDown();

      // Info Section
      doc.fontSize(10);
      doc.text(`Inquiry No: ${inquiry.inquiryNo}`, { align: 'right' });
      doc.text(`Date: ${inquiry.createdAt.toISOString().split('T')[0]}`, {
        align: 'right',
      });
      doc.text(`Status: ${inquiry.status}`, { align: 'right' });
      doc.moveDown();

      doc.text(`Customer: ${inquiry.contactName} (${inquiry.contactEmail})`);
      if (inquiry.company) {
        doc.text(`Company: ${inquiry.company.name}`);
      }
      doc.moveDown(2);

      // Table Header
      const startY = doc.y;
      const colX = { product: 50, sku: 250, qty: 380, price: 430, total: 500 };

      doc.font('Helvetica-Bold');
      doc.text('Product', colX.product, startY);
      doc.text('SKU', colX.sku, startY);
      doc.text('Qty', colX.qty, startY);
      doc.text('Price', colX.price, startY);
      doc.text('Total', colX.total, startY);

      doc
        .moveTo(50, startY + 15)
        .lineTo(550, startY + 15)
        .stroke();
      doc.font('Helvetica');

      let currentY = startY + 25;
      let totalAmount = 0;

      inquiry.items.forEach((item) => {
        if (currentY > 700) {
          doc.addPage();
          currentY = 50;
        }

        const price = Number(item.quotedPrice || item.targetPrice || 0);
        const total = price * item.quantity;
        totalAmount += total;

        doc.text(item.productName.substring(0, 35), colX.product, currentY, {
          width: 190,
        });
        doc.text(
          item.skuSpecs ? item.skuSpecs.substring(0, 20) : '-',
          colX.sku,
          currentY,
          { width: 120 },
        );
        doc.text(String(item.quantity), colX.qty, currentY);
        doc.text(price.toFixed(2), colX.price, currentY);
        doc.text(total.toFixed(2), colX.total, currentY);

        currentY += 20;
      });

      doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
      currentY += 10;

      doc.font('Helvetica-Bold');
      doc.text(
        `Grand Total: $${totalAmount.toFixed(2)}`,
        colX.total - 50,
        currentY,
        { width: 100, align: 'right' },
      );

      currentY += 30;

      const termsItem = inquiry.items.find((i) => i.paymentTerms);
      const validItem = inquiry.items.find((i) => i.quoteValidUntil);

      if (termsItem || validItem) {
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Quote Terms', 50, currentY);
        doc.moveDown(0.5);
        doc.font('Helvetica');

        if (termsItem) {
          doc.text(String(termsItem.paymentTerms), {
            width: 500,
          });
          doc.moveDown(0.5);
        }

        if (validItem) {
          const d = new Date(validItem.quoteValidUntil as any);
          const iso = d.toISOString().split('T')[0];
          doc.text(`Valid until: ${iso}`);
        }
      }

      doc.end();
    });
  }

  async createMessage(inquiryId: string, userId: string, content: string) {
    const message = await this.prisma.inquiryMessage.create({
      data: {
        inquiryId,
        senderId: userId,
        content,
      },
      include: {
        sender: {
          select: { id: true, fullName: true, role: true },
        },
      },
    });

    // Notify logic
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id: inquiryId },
      include: { company: true },
    });

    if (inquiry) {
      const sender = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      const isPlatformAdmin = sender?.role === 'PLATFORM_ADMIN';

      if (isPlatformAdmin) {
        // Admin sent message -> Notify Buyer (Company Admin/Member)
        // Find users in the company
        if (inquiry.companyId) {
          const users = await this.prisma.user.findMany({
            where: { companyId: inquiry.companyId },
          });
          for (const user of users) {
            await this.notificationsService.notifyUser(
              user.id,
              user.email,
              'INQUIRY',
              `New Message on Inquiry ${inquiry.inquiryNo}`,
              `<p>You have a new message from Admin regarding inquiry <strong>${inquiry.inquiryNo}</strong>.</p>`,
              inquiry.id,
              'INQUIRY',
            );
          }
        } else {
          await this.notificationsService.notifyEmailOnly(
            inquiry.contactEmail,
            `New Message on Inquiry ${inquiry.inquiryNo}`,
            `<p>You have a new message from Admin regarding inquiry <strong>${inquiry.inquiryNo}</strong>.</p>`,
          );
        }
      } else {
        // Buyer sent message -> Notify Admin / Sales Rep
        // If company has sales rep, notify them. Else notify platform admins.
        let notified = false;
        if (inquiry.company?.salesRepId) {
          const rep = await this.prisma.user.findUnique({
            where: { id: inquiry.company.salesRepId },
          });
          if (rep) {
            await this.notificationsService.notifyUser(
              rep.id,
              rep.email,
              'INQUIRY',
              `New Message on Inquiry ${inquiry.inquiryNo}`,
              `<p>Buyer sent a message regarding inquiry <strong>${inquiry.inquiryNo}</strong>.</p>`,
              inquiry.id,
              'INQUIRY',
            );
            notified = true;
          }
        }

        if (!notified) {
          await this.notificationsService.notifyAdmin(
            'INQUIRY',
            `New Message on Inquiry ${inquiry.inquiryNo}`,
            `<p>Buyer sent a message regarding inquiry <strong>${inquiry.inquiryNo}</strong>.</p>`,
            inquiry.id,
            'INQUIRY',
          );
        }
      }
    }

    return message;
  }

  async getMessages(inquiryId: string) {
    return this.prisma.inquiryMessage.findMany({
      where: { inquiryId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, fullName: true, role: true },
        },
      },
    });
  }
}
