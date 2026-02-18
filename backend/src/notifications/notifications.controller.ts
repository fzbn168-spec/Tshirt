import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Request,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const count = await this.notificationsService.getUnreadCount(req.user.id);
    return { count };
  }

  @Get()
  findAll(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isRead') isRead?: string,
    @Query('type') type?: string,
    @Query('referenceType') referenceType?: string,
    @Query('q') q?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const p = page ? Math.max(1, parseInt(page, 10)) : undefined;
    const l = limit
      ? Math.max(1, Math.min(100, parseInt(limit, 10)))
      : undefined;
    const skip = p && l ? (p - 1) * l : undefined;
    const take = l;
    const isReadBool =
      isRead === 'true' ? true : isRead === 'false' ? false : undefined;
    const opts = {
      skip,
      take,
      isRead: isReadBool,
      type: type || undefined,
      referenceType: referenceType || undefined,
      q: q || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    } as const;
    if (res) {
      this.notificationsService
        .countAll(req.user.id, req.user.role, opts)
        .then((count) => {
          res.setHeader('X-Total-Count', String(count));
        })
        .catch(() => {});
    }
    return this.notificationsService.findAll(req.user.id, req.user.role, opts);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Patch(':id/unread')
  markAsUnread(@Param('id') id: string) {
    return this.notificationsService.markAsUnread(id);
  }

  @Patch('read-all')
  markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsReadForUser(req.user.id);
  }

  @Get('types')
  getTypes(@Request() req) {
    return this.notificationsService.getTypes(req.user.id, req.user.role);
  }

  @Get('reference-types')
  getReferenceTypes(@Request() req) {
    return this.notificationsService.getReferenceTypes(
      req.user.id,
      req.user.role,
    );
  }

  @Get('count')
  getCount(
    @Request() req,
    @Query('isRead') isRead?: string,
    @Query('type') type?: string,
    @Query('referenceType') referenceType?: string,
    @Query('q') q?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const isReadBool =
      isRead === 'true' ? true : isRead === 'false' ? false : undefined;
    return this.notificationsService.countAll(req.user.id, req.user.role, {
      isRead: isReadBool,
      type: type || undefined,
      referenceType: referenceType || undefined,
      q: q || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  }
}
