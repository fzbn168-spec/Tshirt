import { Module } from '@nestjs/common';
import { SizeChartsService } from './size-charts.service';
import { SizeChartsController } from './size-charts.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [SizeChartsController],
  providers: [SizeChartsService, PrismaService],
  exports: [SizeChartsService],
})
export class SizeChartsModule {}
