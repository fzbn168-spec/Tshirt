import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({ description: 'SKU ID', example: 'uuid-of-sku' })
  @IsString()
  @IsNotEmpty()
  skuId: string;

  @ApiProperty({ description: '购买数量', example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class UpdateCartItemDto {
  @ApiProperty({ description: '更新后的数量', example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}
