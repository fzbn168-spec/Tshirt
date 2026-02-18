import { Injectable, InternalServerErrorException } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor() {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (apiKey) {
      this.stripe = new Stripe(apiKey, {
        apiVersion: '2025-01-27.acacia' as any, // Cast to any to avoid version mismatch with installed package
      });
    } else {
      console.warn(
        'StripeService: STRIPE_SECRET_KEY not found. Stripe features will be disabled.',
      );
    }
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, string>,
  ) {
    if (!this.stripe) {
      // Return a mock response for development without keys
      // Only allow mock in development environment for security
      if (process.env.NODE_ENV !== 'production') {
        return {
          clientSecret: 'mock_client_secret_' + Date.now(),
          id: 'mock_pi_' + Date.now(),
          status: 'requires_payment_method', // simulate real status
          amount,
          currency,
          mock: true,
        };
      } else {
        throw new InternalServerErrorException(
          'Stripe configuration missing in production',
        );
      }
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });
      return {
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        mock: false,
      };
    } catch (error) {
      console.error('Stripe Error:', error);
      throw new InternalServerErrorException('Failed to create payment intent');
    }
  }

  constructEvent(payload: Buffer, signature: string) {
    if (!this.stripe) {
      if (process.env.NODE_ENV !== 'production') {
        // Mock verification for dev
        return {
          type: 'payment_intent.succeeded',
          data: { object: { metadata: { orderId: 'mock_order_id' } } },
        } as any;
      }
      return null;
    }
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not defined');
    }
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  }
}
