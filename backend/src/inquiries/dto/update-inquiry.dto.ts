import { PartialType } from '@nestjs/mapped-types';
import { CreateInquiryDto } from './create-inquiry.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateInquiryDto extends PartialType(CreateInquiryDto) {
  @IsOptional()
  @IsString()
  status?: string;
}
