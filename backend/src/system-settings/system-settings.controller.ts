import { Controller, Get, Body, Put, UseGuards } from '@nestjs/common';
import { SystemSettingsService } from './system-settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('system-settings')
export class SystemSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  @Get()
  async findAll() {
    return this.systemSettingsService.findAll();
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PLATFORM_ADMIN')
  async updateMany(
    @Body() settings: { key: string; value: string; description?: string }[],
  ) {
    return this.systemSettingsService.updateMany(settings);
  }
}
