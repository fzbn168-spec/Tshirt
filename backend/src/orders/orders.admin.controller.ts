import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Res,
  Req,
} from '@nestjs/common';
import { Response } from 'express';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiOperation } from '@nestjs/swagger';
import { RequestWithUser } from '../auth/request-with-user.interface';

@Controller('platform/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PLATFORM_ADMIN')
export class OrdersAdminController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll() {
    return this.ordersService.findAllForAdmin();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id, undefined);
  }

  @Get(':id/pi')
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
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.ordersService.updateStatus(id, status);
  }
}
