import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';
import { TranslationService } from '../translation/translation.service';

@Injectable()
export class AttributesService {
  constructor(
    private prisma: PrismaService,
    private translationService: TranslationService,
  ) {}

  async create(createAttributeDto: CreateAttributeDto) {
    // Auto-translate name if needed
    if (createAttributeDto.name) {
      try {
        const nameObj = JSON.parse(createAttributeDto.name);
        const translated = await this.translationService.autoFill(nameObj);
        createAttributeDto.name = JSON.stringify(translated);
      } catch (e) {
        // If it's a plain string, treat as EN and translate to ZH
        if (typeof createAttributeDto.name === 'string' && !createAttributeDto.name.startsWith('{')) {
           const translated = await this.translationService.autoFill({ en: createAttributeDto.name });
           createAttributeDto.name = JSON.stringify(translated);
        }
      }
    }

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
    if (updateAttributeDto.name) {
      try {
        const nameObj = JSON.parse(updateAttributeDto.name);
        const translated = await this.translationService.autoFill(nameObj);
        updateAttributeDto.name = JSON.stringify(translated);
      } catch (e) {
        // Ignore parse error
      }
    }

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
    
    // Auto translate value
    if (createValueDto.value) {
      try {
        const valObj = JSON.parse(createValueDto.value);
        const translated = await this.translationService.autoFill(valObj);
        createValueDto.value = JSON.stringify(translated);
      } catch (e) {
         if (typeof createValueDto.value === 'string' && !createValueDto.value.startsWith('{')) {
           const translated = await this.translationService.autoFill({ en: createValueDto.value });
           createValueDto.value = JSON.stringify(translated);
         }
      }
    }

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
