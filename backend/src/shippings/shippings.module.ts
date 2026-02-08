import { Module } from '@nestjs/common';
import { ShippingsService } from './shippings.service';
import { ShippingsController } from './shippings.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ShippingsController],
  providers: [ShippingsService, PrismaService],
  exports: [ShippingsService],
})
export class ShippingsModule {}
