import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { RequestWithUser } from '../auth/request-with-user.interface';

@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('profile')
  @Roles('MEMBER', 'ADMIN')
  getProfile(@Req() req: RequestWithUser) {
    if (!req.user.companyId) {
      throw new Error('User does not belong to a company');
    }
    return this.companiesService.findOne(req.user.companyId);
  }

  @Patch('profile')
  @Roles('ADMIN')
  updateProfile(@Req() req: RequestWithUser, @Body() data: any) {
    if (!req.user.companyId) {
        throw new Error('User does not belong to a company');
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.companiesService.update(req.user.companyId, data);
  }
}
