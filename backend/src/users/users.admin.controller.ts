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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Users (Admin)')
@ApiBearerAuth()
@Controller('platform/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PLATFORM_ADMIN')
export class UsersAdminController {
  constructor(private readonly usersService: UsersService) {}

  @Get('sales-reps')
  @ApiOperation({ summary: 'Get all sales representatives' })
  findSalesReps() {
    return this.usersService.findSalesReps();
  }

  @Get()
  @ApiOperation({ summary: 'Get all users (Admin)' })
  findAll() {
    return this.usersService.findAll(undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID (Admin)' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id, undefined);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user (Admin)' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto, undefined);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user (Admin)' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id, undefined);
  }
}
