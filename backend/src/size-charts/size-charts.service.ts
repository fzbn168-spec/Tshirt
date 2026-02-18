import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateSizeChartDto } from './dto/create-size-chart.dto';
import { UpdateSizeChartDto } from './dto/update-size-chart.dto';

@Injectable()
export class SizeChartsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createSizeChartDto: CreateSizeChartDto) {
    return this.prisma.sizeChart.create({
      data: createSizeChartDto,
    });
  }

  findAll() {
    return this.prisma.sizeChart.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const sizeChart = await this.prisma.sizeChart.findUnique({
      where: { id },
    });
    if (!sizeChart) {
      throw new NotFoundException(`SizeChart with ID ${id} not found`);
    }
    return sizeChart;
  }

  async update(id: string, updateSizeChartDto: UpdateSizeChartDto) {
    await this.findOne(id); // Ensure exists
    return this.prisma.sizeChart.update({
      where: { id },
      data: updateSizeChartDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Ensure exists
    return this.prisma.sizeChart.delete({
      where: { id },
    });
  }
}
