import { IsString, IsOptional, IsJSON } from 'class-validator';

export class CreateAnalyticsEventDto {
  @IsString()
  eventType: string; // e.g., 'VIEW_PRODUCT', 'ADD_TO_CART'

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsString()
  @IsOptional()
  metadata?: string; // Should be a valid JSON string
}
