
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreatePackageDto } from './dto/create-package.dto';

@Injectable()
export class PackagesService {
  constructor(private prisma: PrismaService) {}

  async create(createPackageDto: CreatePackageDto) {
    if (createPackageDto.isDefault) {
      // If this one is default, unset others
      await this.prisma.package.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.package.create({
      data: createPackageDto,
    });
  }

  async findAll() {
    return this.prisma.package.findMany({
      orderBy: { isDefault: 'desc' }, // Default first
    });
  }

  async findOne(id: string) {
    return this.prisma.package.findUnique({
      where: { id },
    });
  }

  async update(id: string, updatePackageDto: Partial<CreatePackageDto>) {
    if (updatePackageDto.isDefault) {
       await this.prisma.package.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }
    return this.prisma.package.update({
      where: { id },
      data: updatePackageDto,
    });
  }

  async remove(id: string) {
    return this.prisma.package.delete({
      where: { id },
    });
  }
}
