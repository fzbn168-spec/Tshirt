import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    // Basic DTO handling, assuming data is valid for now
    return this.prisma.category.create({
      data: {
        slug: data.slug,
        name: data.name,
        parentId: data.parentId,
      },
    });
  }

  async findAll() {
    return this.prisma.category.findMany({
      include: { children: true },
    });
  }
}
