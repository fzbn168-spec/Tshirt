import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersAdminController } from './users.admin.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [UsersController, UsersAdminController],
  providers: [UsersService, PrismaService],
})
export class UsersModule {}
