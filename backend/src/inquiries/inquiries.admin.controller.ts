import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { InquiriesService } from './inquiries.service';
import { UpdateInquiryDto } from './dto/update-inquiry.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Inquiries (Admin)')
@ApiBearerAuth()
@Controller('platform/inquiries')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PLATFORM_ADMIN')
export class InquiriesAdminController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all inquiries (Admin)' })
  findAll() {
    // Admin sees all inquiries (pass undefined as companyId)
    return this.inquiriesService.findAll(undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inquiry by ID (Admin)' })
  findOne(@Param('id') id: string) {
    return this.inquiriesService.findOne(id, undefined);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update inquiry (Admin)' })
  update(@Param('id') id: string, @Body() updateInquiryDto: UpdateInquiryDto) {
    return this.inquiriesService.update(id, updateInquiryDto, undefined);
  }
}
