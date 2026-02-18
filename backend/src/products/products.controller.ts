import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiConsumes, ApiBody } from '@nestjs/swagger';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @UseInterceptors(FileInterceptor('file'))
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
  async importProducts(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.productsService.importFromExcel(file.buffer);
  }

  @Get('catalog/pdf')
  async downloadCatalog(@Res() res: Response) {
    const buffer = await this.productsService.generateCatalogPdf();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=product-catalog.pdf',
      'Content-Length': buffer.length,
    });

    res.end(buffer);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get('feed/:type')
  async getFeed(@Param('type') type: string, @Res() res: Response) {
    if (!['google', 'facebook', 'tiktok'].includes(type)) {
      type = 'google'; // default
    }
    const xml = await this.productsService.generateFeed(type as any);
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  }

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('attributes') attributesStr?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    let attributes: Record<string, string[]> | undefined;
    if (attributesStr) {
      try {
        attributes = JSON.parse(attributesStr);
      } catch (e) {
        console.error('Failed to parse attributes filter:', e);
      }
    }

    // Safety check for pagination params
    const pageStr = page || '';
    const limitStr = limit || '';
    const pageInt = parseInt(pageStr);
    const limitInt = parseInt(limitStr);
    const pageNum = isNaN(pageInt) || pageInt < 1 ? 1 : pageInt;
    const limitNum = isNaN(limitInt) || limitInt < 1 ? 50 : limitInt;
    const skip = (pageNum - 1) * limitNum;

    try {
      return await this.productsService.findAll({
        search,
        categoryId,
        minPrice:
          minPrice && !isNaN(Number(minPrice)) ? Number(minPrice) : undefined,
        maxPrice:
          maxPrice && !isNaN(Number(maxPrice)) ? Number(maxPrice) : undefined,
        attributes,
        skip,
        take: limitNum,
      });
    } catch (error) {
      console.error('FindAll Products Error:', error);
      throw error;
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id/sales')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  updateSales(
    @Param('id') id: string,
    @Body('fakeSoldCount') fakeSoldCount: number,
  ) {
    return this.productsService.updateSalesCount(id, fakeSoldCount);
  }

  @Post(':id/skus')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  addSku(@Param('id') id: string, @Body() createSkuDto: any) {
    return this.productsService.addSku(id, createSkuDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
