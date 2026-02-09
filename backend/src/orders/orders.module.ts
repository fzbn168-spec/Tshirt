import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrdersAdminController } from './orders.admin.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [OrdersController, OrdersAdminController],
  providers: [OrdersService, PrismaService],
})
export class OrdersModule {}
