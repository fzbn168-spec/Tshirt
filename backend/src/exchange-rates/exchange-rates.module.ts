import { Module } from '@nestjs/common';
import { ExchangeRatesService } from './exchange-rates.service';
import { ExchangeRatesController } from './exchange-rates.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [ExchangeRatesController],
  providers: [ExchangeRatesService, PrismaService],
  exports: [ExchangeRatesService],
})
export class ExchangeRatesModule {}
