import {
  Controller,
  Post,
  Body,
  UseGuards,
  Headers,
  Req,
  BadRequestException,
  RawBodyRequest,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from '../orders/orders.service';
import Stripe from 'stripe';
import { Request } from 'express';

@ApiTags('Stripe')
@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly ordersService: OrdersService,
  ) {}

  @Post('create-payment-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe Payment Intent' })
  createPaymentIntent(@Body() createPaymentIntentDto: CreatePaymentIntentDto) {
    return this.stripeService.createPaymentIntent(
      createPaymentIntentDto.amount,
      createPaymentIntentDto.currency,
      { orderId: createPaymentIntentDto.orderId || '' },
    );
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe Webhook' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    if (!request.rawBody) {
      throw new BadRequestException('Raw body is missing');
    }

    const event = this.stripeService.constructEvent(request.rawBody, signature);

    if (!event) {
      throw new BadRequestException('Invalid Webhook Event');
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata.orderId;

      console.log(`Payment Succeeded for Order: ${orderId}`);

      if (orderId && orderId !== 'mock_order_id') {
        try {
          await this.ordersService.updateStatus(orderId, 'PAID');
          // TODO: Create Payment Record in database for accounting
        } catch (e) {
          console.error('Failed to update order status via webhook', e);
        }
      }
    }

    return { received: true };
  }
}
