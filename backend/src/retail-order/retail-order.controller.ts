import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RetailOrderService } from './retail-order.service';
import {
  CreateRetailOrderDto,
  UpdateRetailOrderStatusDto,
} from './dto/retail-order.dto';

@ApiTags('Retail Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class RetailOrderController {
  constructor(private readonly retailOrderService: RetailOrderService) {}

  // ----------------------------------------------------------------
  // 普通用户接口
  // ----------------------------------------------------------------

  @Post('retail-orders')
  @ApiOperation({ summary: '创建零售订单 (从购物车结算)' })
  async createOrder(@Request() req, @Body() dto: CreateRetailOrderDto) {
    return this.retailOrderService.createOrder(req.user.id, dto);
  }

  @Get('retail-orders')
  @ApiOperation({ summary: '获取我的订单列表' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  async getMyOrders(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
  ) {
    return this.retailOrderService.getOrders(
      req.user.id,
      Number(page),
      Number(limit),
      status,
    );
  }

  @Get('retail-orders/:id')
  @ApiOperation({ summary: '获取我的订单详情' })
  async getMyOrder(@Request() req, @Param('id') id: string) {
    return this.retailOrderService.getOrderById(id, req.user.id);
  }

  // ----------------------------------------------------------------
  // 管理员接口
  // ----------------------------------------------------------------

  @Get('admin/retail-orders')
  @Roles('ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: '管理员获取所有订单列表' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  async getAllOrders(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
  ) {
    return this.retailOrderService.getOrders(
      undefined, // 不传 userId，查询所有
      Number(page),
      Number(limit),
      status,
    );
  }

  @Get('admin/retail-orders/:id')
  @Roles('ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: '管理员获取订单详情' })
  async getOrder(@Param('id') id: string) {
    return this.retailOrderService.getOrderById(id);
  }

  @Patch('admin/retail-orders/:id/status')
  @Roles('ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: '管理员更新订单状态' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateRetailOrderStatusDto,
  ) {
    return this.retailOrderService.updateOrderStatus(id, dto);
  }
}
