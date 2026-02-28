import { Module } from '@nestjs/common';
import { RetailOrderService } from './retail-order.service';
import { RetailOrderController } from './retail-order.controller';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [RetailOrderService, PrismaService],
  controllers: [RetailOrderController],
})
export class RetailOrderModule {}
