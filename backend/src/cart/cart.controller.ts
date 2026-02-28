import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';

@ApiTags('Cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: '获取当前用户的购物车' })
  async getCart(@Request() req) {
    return this.cartService.getOrCreateCart(req.user.id);
  }

  @Post('add')
  @ApiOperation({ summary: '添加商品到购物车' })
  async addToCart(@Request() req, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(req.user.id, dto);
  }

  @Patch('item/:itemId')
  @ApiOperation({ summary: '更新购物车商品数量' })
  async updateCartItem(
    @Request() req,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateCartItem(req.user.id, itemId, dto);
  }

  @Delete('item/:itemId')
  @ApiOperation({ summary: '删除购物车项' })
  async removeCartItem(@Request() req, @Param('itemId') itemId: string) {
    return this.cartService.removeCartItem(req.user.id, itemId);
  }

  @Delete()
  @ApiOperation({ summary: '清空购物车' })
  async clearCart(@Request() req) {
    return this.cartService.clearCart(req.user.id);
  }
}
