import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  skuId?: string;

  @IsString()
  productName: string;

  @IsOptional()
  @IsString()
  skuSpecs?: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  inquiryId?: string;

  @IsOptional()
  @IsString()
  type?: string; // 'STANDARD' | 'SAMPLE'

  @IsOptional()
  @IsString()
  consigneeName?: string;

  @IsOptional()
  @IsString()
  consigneePhone?: string;

  @IsOptional()
  @IsString()
  consigneeCountry?: string;

  @IsOptional()
  @IsString()
  consigneeState?: string;

  @IsOptional()
  @IsString()
  consigneeCity?: string;

  @IsOptional()
  @IsString()
  consigneePostalCode?: string;

  @IsOptional()
  @IsString()
  consigneeAddress1?: string;

  @IsOptional()
  @IsString()
  consigneeAddress2?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
