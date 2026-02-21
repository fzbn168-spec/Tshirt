import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInquiryItemDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsString()
  productName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  skuId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  skuSpecs?: string;

  @ApiProperty()
  @IsInt()
  quantity: number;

  @ApiProperty()
  @IsNumber()
  price: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  quotedPrice?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  quoteValidUntil?: string;
}

export class CreateInquiryDto {
  @ApiProperty()
  @IsString()
  contactName: string;

  @ApiProperty()
  @IsEmail()
  contactEmail: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  message?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  attachments?: string; // JSON string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  type?: string; // 'STANDARD' | 'SAMPLE'

  @ApiProperty({ type: [CreateInquiryItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInquiryItemDto)
  items: CreateInquiryItemDto[];
}
