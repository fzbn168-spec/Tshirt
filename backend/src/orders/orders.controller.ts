import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Res,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { RequestWithUser } from '../auth/request-with-user.interface';
import { ApiOperation } from '@nestjs/swagger';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles('MEMBER', 'ADMIN')
  create(@Req() req: RequestWithUser, @Body() createOrderDto: CreateOrderDto) {
    if (!req.user.companyId) {
      throw new BadRequestException('User does not belong to a company');
    }
    // req.user is populated by JwtStrategy (Prisma User object)
    return this.ordersService.create(
      req.user.id,
      req.user.companyId,
      createOrderDto,
    );
  }

  @Get()
  @Roles('MEMBER', 'ADMIN')
  findAll(@Req() req: RequestWithUser) {
    if (!req.user.companyId) {
      throw new BadRequestException('User does not belong to a company');
    }
    return this.ordersService.findAll(req.user.companyId);
  }

  @Get('export')
  @Roles('MEMBER', 'ADMIN')
  async export(@Req() req: RequestWithUser, @Res() res: Response) {
    if (!req.user.companyId) {
      throw new BadRequestException('User does not belong to a company');
    }
    const { companyId } = req.user;
    const orders = await this.ordersService.findAll(companyId);

    const headers = [
      'Order No',
      'Order Date',
      'Company Name',
      'Company Email',
      'Company Address',
      'Buyer Name',
      'Buyer Email',
      'Consignee Name',
      'Consignee Phone',
      'Consignee Country',
      'Consignee State',
      'Consignee City',
      'Consignee Postal Code',
      'Consignee Address1',
      'Consignee Address2',
      'Type',
      'Status',
      'Incoterms',
      'Port Of Loading',
      'Port Of Destination',
      'Total Amount',
      'Currency',
      'Source',
    ];

    const rows = orders.map((order: any) => {
      const source = order.inquiry
        ? `RFQ:${order.inquiry.inquiryNo}`
        : 'Direct';
      const createdAt = order.createdAt
        ? new Date(order.createdAt).toISOString()
        : '';
      return [
        order.orderNo,
        createdAt,
        order.company?.name || '',
        order.company?.contactEmail || '',
        order.company?.address || '',
        order.user?.fullName || '',
        order.user?.email || '',
        order.consigneeName || '',
        order.consigneePhone || '',
        order.consigneeCountry || '',
        order.consigneeState || '',
        order.consigneeCity || '',
        order.consigneePostalCode || '',
        order.consigneeAddress1 || '',
        order.consigneeAddress2 || '',
        order.type || 'STANDARD',
        order.status,
        order.incoterms || '',
        order.portOfLoading || '',
        order.portOfDestination || '',
        Number(order.totalAmount).toFixed(2),
        order.currency || '',
        source,
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
      `attachment; filename=orders-${companyId}.csv`,
    );
    res.send(csv);
  }

  @Get(':id')
  @Roles('MEMBER', 'ADMIN')
  findOne(@Req() req: RequestWithUser, @Param('id') id: string) {
    if (!req.user.companyId) {
      throw new BadRequestException('User does not belong to a company');
    }
    return this.ordersService.findOne(id, req.user.companyId);
  }

  @Get(':id/pi')
  @Roles('MEMBER', 'ADMIN')
  @ApiOperation({ summary: 'Download Proforma Invoice PDF' })
  async downloadPi(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Res() res: Response,
  ) {
    const buffer = await this.ordersService.generatePi(id, req.user);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=PI-${id}.pdf`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Get(':id/ci')
  @Roles('MEMBER', 'ADMIN')
  @ApiOperation({ summary: 'Download Commercial Invoice PDF' })
  async downloadCi(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Res() res: Response,
  ) {
    const buffer = await this.ordersService.generateCi(id, req.user);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=CI-${id}.pdf`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Get(':id/pl')
  @Roles('MEMBER', 'ADMIN')
  @ApiOperation({ summary: 'Download Packing List PDF' })
  async downloadPl(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Res() res: Response,
  ) {
    const buffer = await this.ordersService.generatePl(id, req.user);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=PL-${id}.pdf`,
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }
}
