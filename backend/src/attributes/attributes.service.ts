import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';

@Injectable()
export class AttributesService {
  constructor(private prisma: PrismaService) {}

  async create(createAttributeDto: CreateAttributeDto) {
    return this.prisma.attribute.create({
      data: createAttributeDto,
    });
  }

  async findAll() {
    return this.prisma.attribute.findMany({
      include: {
        values: true,
      },
    });
  }

  async findOne(id: string) {
    const attribute = await this.prisma.attribute.findUnique({
      where: { id },
      include: {
        values: true,
      },
    });
    if (!attribute) {
      throw new NotFoundException(`Attribute with ID ${id} not found`);
    }
    return attribute;
  }

  async update(id: string, updateAttributeDto: CreateAttributeDto) {
    return this.prisma.attribute.update({
      where: { id },
      data: updateAttributeDto,
    });
  }

  async remove(id: string) {
    return this.prisma.attribute.delete({
      where: { id },
    });
  }

  async addValue(attributeId: string, createValueDto: CreateAttributeValueDto) {
    // Verify attribute exists
    await this.findOne(attributeId);
    
    return this.prisma.attributeValue.create({
      data: {
        ...createValueDto,
        attributeId,
      },
    });
  }

  async removeValue(valueId: string) {
    return this.prisma.attributeValue.delete({
      where: { id: valueId },
    });
  }
}
