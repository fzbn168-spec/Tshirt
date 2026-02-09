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
} from '@nestjs/common';
import type { Response } from 'express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

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
    const pageInt = parseInt(page ?? '');
    const limitInt = parseInt(limit ?? '');
    const pageNum = isNaN(pageInt) || pageInt < 1 ? 1 : pageInt;
    const limitNum = isNaN(limitInt) || limitInt < 1 ? 50 : limitInt;
    const skip = (pageNum - 1) * limitNum;

    console.log(`[Products] findAll request: page=${pageNum}, limit=${limitNum}, skip=${skip}`);

    try {
      return await this.productsService.findAll({ 
        search, 
        categoryId, 
        minPrice: minPrice && !isNaN(Number(minPrice)) ? Number(minPrice) : undefined, 
        maxPrice: maxPrice && !isNaN(Number(maxPrice)) ? Number(maxPrice) : undefined,
        attributes,
        skip,
        take: limitNum
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
