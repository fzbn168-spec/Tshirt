import { Module } from '@nestjs/common';
import { InquiriesService } from './inquiries.service';
import { InquiriesController } from './inquiries.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [InquiriesController],
  providers: [InquiriesService, PrismaService],
})
export class InquiriesModule {}
