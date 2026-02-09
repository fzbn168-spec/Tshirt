import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ShippingsService } from './shippings.service';
import { CreateShippingDto } from './dto/create-shipping.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Shippings')
@ApiBearerAuth()
@Controller('shippings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShippingsController {
  constructor(private readonly shippingsService: ShippingsService) {}

  @Post()
  @Roles('ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Create shipping for order' })
  create(@Body() createShippingDto: CreateShippingDto) {
    return this.shippingsService.create(createShippingDto);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get shippings by order ID' })
  findByOrder(@Param('orderId') orderId: string) {
    return this.shippingsService.findByOrder(orderId);
  }
}
