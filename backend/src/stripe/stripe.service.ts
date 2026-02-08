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
      console.warn('StripeService: STRIPE_SECRET_KEY not found. Stripe features will be disabled.');
    }
  }

  async createPaymentIntent(amount: number, currency: string, metadata?: Record<string, string>) {
    if (!this.stripe) {
      // Return a mock response for development without keys
      // Only allow mock in development environment for security
      if (process.env.NODE_ENV !== 'production') {
        console.log('StripeService: Using mock payment intent (dev only)');
        return {
          clientSecret: 'mock_client_secret_' + Date.now(),
          id: 'mock_pi_' + Date.now(),
          status: 'requires_payment_method', // simulate real status
          amount,
          currency,
          mock: true
        };
      } else {
        throw new InternalServerErrorException('Stripe configuration missing in production');
      }
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });
      return paymentIntent;
    } catch (error) {
      console.error('Stripe Error:', error);
      throw new InternalServerErrorException('Failed to create payment intent');
    }
  }
}
