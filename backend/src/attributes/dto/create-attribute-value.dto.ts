import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAttributeValueDto {
  @ApiProperty({ example: '{"en": "Red", "zh": "红色"}' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({ example: '#FF0000', required: false })
  @IsString()
  @IsOptional()
  meta?: string;
}
