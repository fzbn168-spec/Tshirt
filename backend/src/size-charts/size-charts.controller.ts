import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { SizeChartsService } from './size-charts.service';
import { CreateSizeChartDto } from './dto/create-size-chart.dto';
import { UpdateSizeChartDto } from './dto/update-size-chart.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('size-charts')
export class SizeChartsController {
  constructor(private readonly sizeChartsService: SizeChartsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN')
  create(@Body() createSizeChartDto: CreateSizeChartDto) {
    return this.sizeChartsService.create(createSizeChartDto);
  }

  @Get()
  findAll() {
    return this.sizeChartsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sizeChartsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN')
  update(
    @Param('id') id: string,
    @Body() updateSizeChartDto: UpdateSizeChartDto,
  ) {
    return this.sizeChartsService.update(id, updateSizeChartDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN')
  remove(@Param('id') id: string) {
    return this.sizeChartsService.remove(id);
  }
}
