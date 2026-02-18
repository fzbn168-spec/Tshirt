import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // Public: Get reviews for a product
  @Get('product/:productId')
  findAllByProduct(@Param('productId') productId: string) {
    return this.reviewsService.findAllByProduct(productId);
  }

  // Public/User: Create a review (User ID is optional/extracted from token if available)
  // We allow anonymous reviews for now, or we can enforce auth.
  // Given the requirement "Virtual reviews", admin needs to create them too.
  @Post()
  // @UseGuards(JwtAuthGuard) // Disabled to allow anonymous/admin creation without user token constraint for now
  create(@Body() createReviewDto: CreateReviewDto, @Request() req) {
    // Note: AuthGuard might throw 401 if no token.
    // If we want public reviews, we should make AuthGuard optional or handle logic differently.
    // For "fake reviews", Admin will use this endpoint too.
    const userId = req.user?.userId; // Adjusted to match JwtStrategy usually returning userId
    return this.reviewsService.create(createReviewDto, userId);
  }

  // Admin: Create review (Bypassing AuthGuard if we want strict admin endpoint, but reusing create is fine)
  // Let's add a specific admin endpoint for bulk/fake creation if needed, but 'create' handles it via DTO.

  // Admin: List all reviews
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN', 'ADMIN') // Adjusted roles to match system
  findAllAdmin(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '20',
  ) {
    return this.reviewsService.findAllAdmin(+page, +pageSize);
  }

  // Admin: Delete review
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}
