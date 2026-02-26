
import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreatePackageDto {
  @IsString()
  name: string;

  @IsNumber()
  length: number;

  @IsNumber()
  width: number;

  @IsNumber()
  height: number;

  @IsNumber()
  weight: number;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
