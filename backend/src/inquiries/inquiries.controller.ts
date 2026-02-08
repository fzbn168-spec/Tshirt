import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { InquiriesService } from './inquiries.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { UpdateInquiryDto } from './dto/update-inquiry.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { RequestWithUser } from '../auth/request-with-user.interface';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('Inquiries')
@ApiBearerAuth()
@Controller('inquiries')
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new inquiry (Public)' })
  create(
    @Body() createInquiryDto: CreateInquiryDto,
    @Req() req: RequestWithUser,
  ) {
    // Note: If no guard is used, req.user is undefined.
    // If we want to support optional auth, we need a custom guard.
    // For now, we allow public access.
    const companyId = req.user?.role === 'PLATFORM_ADMIN' ? undefined : req.user?.companyId;
    return this.inquiriesService.create(createInquiryDto, companyId || undefined);
  }

  @Post('import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MEMBER', 'ADMIN', 'PLATFORM_ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import inquiries from Excel' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  import(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithUser,
  ) {
    if (!file) {
        throw new BadRequestException('File is required');
    }
    return this.inquiriesService.importFromExcel(file.buffer, req.user);
  }

  @Get(':id/pdf')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MEMBER', 'ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Download inquiry PDF' })
  async downloadPdf(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
    @Res() res: Response,
  ) {
    const buffer = await this.inquiriesService.generatePdf(id, req.user);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=Inquiry-${id}.pdf`,
      'Content-Length': buffer.length,
    });
    
    res.end(buffer);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MEMBER', 'ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Get all inquiries' })
  findAll(@Req() req: RequestWithUser) {
    const companyId =
      req.user.role === 'PLATFORM_ADMIN' ? undefined : req.user.companyId;
    return this.inquiriesService.findAll(companyId || undefined);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MEMBER', 'ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Get inquiry by ID' })
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    const companyId =
      req.user.role === 'PLATFORM_ADMIN' ? undefined : req.user.companyId;
    return this.inquiriesService.findOne(id, companyId || undefined);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MEMBER', 'ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Update inquiry' })
  update(
    @Param('id') id: string,
    @Body() updateInquiryDto: UpdateInquiryDto,
    @Req() req: RequestWithUser,
  ) {
    const companyId =
      req.user.role === 'PLATFORM_ADMIN' ? undefined : req.user.companyId;
    return this.inquiriesService.update(
      id,
      updateInquiryDto,
      companyId || undefined,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MEMBER', 'ADMIN', 'PLATFORM_ADMIN')
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    const companyId =
      req.user.role === 'PLATFORM_ADMIN' ? undefined : req.user.companyId;
    return this.inquiriesService.remove(id, companyId || undefined);
  }

  @Post(':id/messages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MEMBER', 'ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Send a message' })
  sendMessage(
    @Param('id') id: string,
    @Body('content') content: string,
    @Req() req: RequestWithUser,
  ) {
    return this.inquiriesService.createMessage(id, req.user.id, content);
  }

  @Get(':id/messages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('MEMBER', 'ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Get messages' })
  getMessages(@Param('id') id: string) {
    return this.inquiriesService.getMessages(id);
  }
}
