import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CreateAnalyticsEventDto } from './dto/create-analytics-event.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track')
  async trackEvent(@Body() createAnalyticsEventDto: CreateAnalyticsEventDto) {
    return this.analyticsService.trackEvent(createAnalyticsEventDto);
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PLATFORM_ADMIN')
  async getDashboardStats() {
    return this.analyticsService.getDashboardStats();
  }

  @Get('funnel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PLATFORM_ADMIN')
  async getFunnelData(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getFunnelData(startDate, endDate);
  }
}
