import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Request,
  Patch,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestWithUser } from '../auth/request-with-user.interface';
import { Roles } from '../auth/roles.decorator';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(
    @Request() req: RequestWithUser,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return this.paymentsService.create(req.user.id, createPaymentDto);
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'PLATFORM_ADMIN')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.paymentsService.updateStatus(id, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Get('order/:orderId')
  findByOrder(@Param('orderId') orderId: string) {
    return this.paymentsService.findByOrder(orderId);
  }

  @Get('export/orders')
  async exportForUser(@Request() req: RequestWithUser, @Res() res: Response) {
    const { id: userId } = req.user;
    const payments = await this.paymentsService.findForUser(userId);

    const headers = [
      'Payment ID',
      'Order No',
      'Order Date',
      'Company Name',
      'Company Email',
      'Company Address',
      'Consignee Name',
      'Consignee Country',
      'Consignee City',
      'Amount',
      'Currency',
      'Method',
      'Status',
      'Paid At',
      'Created At',
    ];

    const rows = payments.map((p: any) => {
      const createdAt = p.createdAt ? new Date(p.createdAt).toISOString() : '';
      const orderDate = p.order?.createdAt
        ? new Date(p.order.createdAt).toISOString()
        : '';
      const paidAt = p.paidAt ? new Date(p.paidAt).toISOString() : '';
      return [
        p.id,
        p.order?.orderNo || '',
        orderDate,
        p.order?.company?.name || '',
        p.order?.company?.contactEmail || '',
        p.order?.company?.address || '',
        p.order?.consigneeName || '',
        p.order?.consigneeCountry || '',
        p.order?.consigneeCity || '',
        Number(p.amount).toFixed(2),
        p.order?.currency || '',
        p.method,
        p.status,
        paidAt,
        createdAt,
      ];
    });

    const csvLines = [
      headers.join(','),
      ...rows.map((r) =>
        r
          .map((field) => {
            if (field == null) return '';
            const value = String(field);
            if (
              value.includes(',') ||
              value.includes('"') ||
              value.includes('\n')
            ) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(','),
      ),
    ];

    const csv = csvLines.join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=payments-history.csv',
    );
    res.send(csv);
  }
}
