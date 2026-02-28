import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// 支付方式枚举
export enum PaymentMethod {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  BANK_TRANSFER = 'BANK_TRANSFER',
  WESTERN_UNION = 'WESTERN_UNION',
}

// 订单状态枚举
export enum OrderStatus {
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// 支付状态枚举
export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
}

export class CreateRetailOrderDto {
  @ApiProperty({
    description: '收货地址 JSON 对象',
    example: {
      name: 'John Doe',
      line1: '123 Main St',
      city: 'New York',
      country: 'USA',
    },
  })
  @IsObject()
  @IsNotEmpty()
  shippingAddress: any;

  @ApiProperty({
    description: '支付方式',
    enum: PaymentMethod,
    example: PaymentMethod.BANK_TRANSFER,
  })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: string;

  @ApiPropertyOptional({
    description: '客户定制需求 JSON 对象',
    example: { logoUrl: 'http://...', note: 'Please expedite' },
  })
  @IsOptional()
  customRequests?: any;
}

export class UpdateRetailOrderStatusDto {
  @ApiPropertyOptional({
    description: '订单状态',
    enum: OrderStatus,
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  orderStatus?: string;

  @ApiPropertyOptional({
    description: '支付状态',
    enum: PaymentStatus,
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: string;
}
