import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(createReviewDto: CreateReviewDto, userId?: string) {
    const {
      productId,
      userName,
      rating,
      content,
      images,
      isPublished,
      createdAt,
    } = createReviewDto;

    // If userId is provided, try to get user's name if userName is not provided
    let finalUserName = userName;
    if (userId && !finalUserName) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        finalUserName = user.fullName || user.email;
      }
    }

    // Default to "Guest" if still empty
    if (!finalUserName) {
      finalUserName = 'Guest';
    }

    return this.prisma.review.create({
      data: {
        productId,
        userId: userId || null,
        authorName: finalUserName,
        rating,
        content,
        images,
        isPublished: isPublished ?? true,
        createdAt: createdAt ? new Date(createdAt) : new Date(),
      },
    });
  }

  async findAllByProduct(productId: string) {
    return this.prisma.review.findMany({
      where: {
        productId,
        isPublished: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Admin: Get all reviews (including unpublished)
  async findAllAdmin(page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;
    const [total, reviews] = await Promise.all([
      this.prisma.review.count(),
      this.prisma.review.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              title: true,
              images: true,
            },
          },
        },
      }),
    ]);

    return {
      data: reviews,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async remove(id: string) {
    return this.prisma.review.delete({
      where: { id },
    });
  }
}
