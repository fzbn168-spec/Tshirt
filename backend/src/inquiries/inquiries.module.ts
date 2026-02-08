import { Module } from '@nestjs/common';
import { InquiriesService } from './inquiries.service';
import { InquiriesController } from './inquiries.controller';
import { InquiriesAdminController } from './inquiries.admin.controller';
import { PrismaService } from '../prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [InquiriesController, InquiriesAdminController],
  providers: [InquiriesService, PrismaService],
})
export class InquiriesModule {}
