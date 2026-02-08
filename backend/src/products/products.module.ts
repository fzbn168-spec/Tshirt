import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [CategoriesController, ProductsController],
  providers: [ProductsService, CategoriesService, PrismaService],
})
export class ProductsModule {}
