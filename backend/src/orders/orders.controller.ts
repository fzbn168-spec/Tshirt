import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Res,
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
      throw new Error('User does not belong to a company');
    }
    // req.user is populated by JwtStrategy (Prisma User object)
    return this.ordersService.create(
      req.user.id,
      req.user.companyId,
      createOrderDto,
    );
  }

  @Get('admin')
  @Roles('PLATFORM_ADMIN')
  findAllAdmin() {
    return this.ordersService.findAllForAdmin();
  }

  @Get()
  @Roles('MEMBER', 'ADMIN')
  findAll(@Req() req: RequestWithUser) {
    if (!req.user.companyId) {
      throw new Error('User does not belong to a company');
    }
    return this.ordersService.findAll(req.user.companyId);
  }

  @Get(':id')
  @Roles('MEMBER', 'ADMIN', 'PLATFORM_ADMIN')
  findOne(@Req() req: RequestWithUser, @Param('id') id: string) {
    // If platform admin, pass undefined for companyId to bypass scope check
    const companyId =
      req.user.role === 'PLATFORM_ADMIN' ? undefined : req.user.companyId;

    if (req.user.role !== 'PLATFORM_ADMIN' && !companyId) {
      throw new Error('User does not belong to a company');
    }

    return this.ordersService.findOne(id, companyId || undefined);
  }

  @Get(':id/pi')
  @Roles('MEMBER', 'ADMIN', 'PLATFORM_ADMIN')
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

  @Post(':id/status')
  @Roles('PLATFORM_ADMIN')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.ordersService.updateStatus(id, status);
  }
}
