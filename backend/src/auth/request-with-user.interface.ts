import { Request } from 'express';
import { User, Company } from '@prisma/client';

export interface RequestWithUser extends Request {
  user: User & { company?: Company | null };
}
