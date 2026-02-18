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
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { RequestWithUser } from '../auth/request-with-user.interface';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Create a new user in my company' })
  create(@Body() createUserDto: CreateUserDto, @Req() req: RequestWithUser) {
    // Only Company Admin or Platform Admin can create users
    const companyId =
      req.user.role === 'PLATFORM_ADMIN' ? undefined : req.user.companyId;

    // For now, enforcing creation under a company context
    if (!req.user.companyId) {
      throw new BadRequestException(
        'Company context required to create user via this endpoint',
      );
    }
    return this.usersService.create(createUserDto, req.user.companyId);
  }

  @Get()
  @Roles('ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Get users in my company' })
  findAll(@Req() req: RequestWithUser) {
    if (!req.user.companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.usersService.findAll(req.user.companyId);
  }

  @Get(':id')
  @Roles('ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Get user by ID in my company' })
  findOne(@Param('id') id: string, @Req() req: RequestWithUser) {
    if (!req.user.companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.usersService.findOne(id, req.user.companyId);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update user in my company' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: RequestWithUser,
  ) {
    if (!req.user.companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.usersService.update(id, updateUserDto, req.user.companyId);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete user in my company' })
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    if (!req.user.companyId) {
      throw new BadRequestException('User must belong to a company');
    }
    return this.usersService.remove(id, req.user.companyId);
  }
}
