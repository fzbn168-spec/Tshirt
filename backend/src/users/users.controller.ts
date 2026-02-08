import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestWithUser } from '../auth/request-with-user.interface';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto, @Req() req: RequestWithUser) {
    const companyId = req.user.role === 'PLATFORM_ADMIN' ? undefined : (req.user.companyId || undefined);
    if (!companyId && req.user.role !== 'PLATFORM_ADMIN') throw new BadRequestException('No company ID');
    // For now, even Platform Admin must create user under a company, or we need to pass companyId in DTO
    // Assuming simple case: User creates member in their own company
    if (!req.user.companyId) throw new BadRequestException('Company ID required to create user');
    return this.usersService.create(createUserDto, req.user.companyId);
  }

  @Get()
  findAll(@Req() req: RequestWithUser) {
    const companyId = req.user.role === 'PLATFORM_ADMIN' ? undefined : (req.user.companyId || undefined);
    if (!companyId && req.user.role !== 'PLATFORM_ADMIN') throw new BadRequestException('No company ID');
    return this.usersService.findAll(companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    const companyId = req.user.role === 'PLATFORM_ADMIN' ? undefined : (req.user.companyId || undefined);
    if (!companyId && req.user.role !== 'PLATFORM_ADMIN') throw new BadRequestException('No company ID');
    return this.usersService.findOne(id, companyId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: RequestWithUser,
  ) {
    const companyId = req.user.role === 'PLATFORM_ADMIN' ? undefined : (req.user.companyId || undefined);
    if (!companyId && req.user.role !== 'PLATFORM_ADMIN') throw new BadRequestException('No company ID');
    return this.usersService.update(id, updateUserDto, companyId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    const companyId = req.user.role === 'PLATFORM_ADMIN' ? undefined : (req.user.companyId || undefined);
    if (!companyId && req.user.role !== 'PLATFORM_ADMIN') throw new BadRequestException('No company ID');
    return this.usersService.remove(id, companyId);
  }
}
