import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAttributeDto {
  @ApiProperty({ example: '{"en": "Color", "zh": "颜色"}' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'color' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'text', required: false })
  @IsString()
  @IsOptional()
  type?: string;
}
