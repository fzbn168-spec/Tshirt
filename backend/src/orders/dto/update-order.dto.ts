import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrderDto {
  @ApiPropertyOptional({ description: 'Incoterms (FOB, CIF, etc.)' })
  @IsOptional()
  @IsString()
  incoterms?: string;

  @ApiPropertyOptional({ description: 'Shipping Marks' })
  @IsOptional()
  @IsString()
  shippingMarks?: string;

  @ApiPropertyOptional({ description: 'Port of Loading' })
  @IsOptional()
  @IsString()
  portOfLoading?: string;

  @ApiPropertyOptional({ description: 'Port of Destination' })
  @IsOptional()
  @IsString()
  portOfDestination?: string;

  @ApiPropertyOptional({ description: 'Order Status' })
  @IsOptional()
  @IsString()
  status?: string;
}
