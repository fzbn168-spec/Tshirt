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

  async create(createInquiryDto: CreateInquiryDto, companyId?: string) {
    const { items, ...inquiryData } = createInquiryDto;

    // Generate simple inquiry number
    const count = await this.prisma.inquiry.count();
    const inquiryNo = `RFQ-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

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

    // Notify Admin
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

    return inquiry;
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

  async update(
    id: string,
    updateInquiryDto: UpdateInquiryDto,
    companyId?: string,
  ) {
    // Verify existence and permission first
    const existing = await this.findOne(id, companyId);

    const { items, ...data } = updateInquiryDto;

    const updatedInquiry = await this.prisma.$transaction(async (prisma) => {
      if (items) {
        // Replace items if provided
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
          })),
        });
      }

      return prisma.inquiry.update({
        where: { id },
        data,
        include: { items: true },
      });
    });

    // Notify User if quoted
    if (data.status === 'QUOTED' && existing.status !== 'QUOTED') {
      // Find a user associated with this company (or just use contactEmail if no user)
      // Since Inquiry has companyId, we can try to notify company users.
      // But for simplicity, we rely on contactEmail which is always present in Inquiry.
      // However, notification requires userId if we want it to show up in dashboard.
      // If anonymous, just email. If registered, we should try to find the user.

      let userId: string | null = null;
      if (updatedInquiry.companyId) {
        // Try to find the first admin/member of the company
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
        // Just email if no user found (e.g. anonymous or data inconsistency)
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
        // If page break needed
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
