import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
  Header,
} from '@nestjs/common';
import { PlatformService } from './platform.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('platform')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PLATFORM_ADMIN')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get('dashboard-stats')
  getDashboardStats() {
    return this.platformService.getDashboardStats();
  }

  @Get('companies')
  findAllCompanies(@Query('salesRepId') salesRepId?: string) {
    return this.platformService.findAllCompanies(salesRepId);
  }

  @Get('companies/export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="companies.csv"')
  exportCompanies() {
    return this.platformService.exportCompanies();
  }

  @Get('sales-reps')
  findAllSalesReps() {
    return this.platformService.findAllSalesReps();
  }

  @Patch('companies/:id/sales-rep')
  assignSalesRep(
    @Param('id') id: string,
    @Body('salesRepId') salesRepId: string,
  ) {
    return this.platformService.assignSalesRep(id, salesRepId);
  }

  @Patch('companies/:id/status')
  updateCompanyStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.platformService.updateCompanyStatus(id, status);
  }
}
