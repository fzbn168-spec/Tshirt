import { IsString, IsNotEmpty } from 'class-validator';

export class CreateSizeChartDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  data: string; // JSON string
}
