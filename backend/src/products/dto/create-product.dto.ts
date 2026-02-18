import {
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSkuDto {
  @IsString()
  skuCode: string;

  @IsString()
  specs: string; // JSON string

  @IsNumber()
  price: number;

  @IsNumber()
  moq: number;

  @IsNumber()
  stock: number;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  leadTime?: string;

  @IsString()
  @IsOptional()
  tierPrices?: string; // JSON string

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attributeValueIds?: string[];

  // Packing Info
  @IsNumber()
  @IsOptional()
  cartonLength?: number;

  @IsNumber()
  @IsOptional()
  cartonWidth?: number;

  @IsNumber()
  @IsOptional()
  cartonHeight?: number;

  @IsNumber()
  @IsOptional()
  cartonGrossWeight?: number;
}

export class CreateProductDto {
  @IsString()
  categoryId: string;

  @IsString()
  title: string; // JSON string

  @IsString()
  description: string; // JSON string

  @IsString()
  images: string; // JSON string

  @IsNumber()
  basePrice: number;

  @IsString()
  specsTemplate: string; // JSON string

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSkuDto)
  skus: CreateSkuDto[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attributeIds?: string[];

  @IsString()
  @IsOptional()
  sizeChartId?: string;

  @IsNumber()
  @IsOptional()
  fakeSoldCount?: number;

  @IsString()
  @IsOptional()
  sizeChartImage?: string;

  @IsString()
  @IsOptional()
  materialDetail?: string; // JSON

  @IsString()
  @IsOptional()
  originCountry?: string;

  @IsString()
  @IsOptional()
  loadingPort?: string;

  @IsString()
  @IsOptional()
  season?: string;
}
