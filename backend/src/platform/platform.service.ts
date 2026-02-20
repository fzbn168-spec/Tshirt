import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PlatformService {
  constructor(private prisma: PrismaService) {}

  async findAllCompanies(salesRepId?: string) {
    const where = salesRepId ? { salesRepId } : {};
    return this.prisma.company.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        salesRep: {
          select: { id: true, fullName: true, email: true },
        },
        _count: {
          select: { users: true, inquiries: true },
        },
      },
    });
  }

  async findAllSalesReps() {
    return this.prisma.user.findMany({
      where: { role: 'PLATFORM_ADMIN' },
      select: { id: true, fullName: true, email: true },
    });
  }

  async assignSalesRep(companyId: string, salesRepId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Check if sales rep exists (optional but good practice)
    // const rep = await this.prisma.user.findUnique({ where: { id: salesRepId } });

    return this.prisma.company.update({
      where: { id: companyId },
      data: { salesRepId },
    });
  }

  async updateCompanyStatus(id: string, status: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return this.prisma.company.update({
      where: { id },
      data: { status },
    });
  }

  async getDashboardStats() {
    const totalCompanies = await this.prisma.company.count();
    const pendingCompanies = await this.prisma.company.count({
      where: { status: 'PENDING' },
    });
    const totalInquiries = await this.prisma.inquiry.count();
    const totalUsers = await this.prisma.user.count();

    return {
      totalCompanies,
      pendingCompanies,
      totalInquiries,
      totalUsers,
    };
  }

  async exportCompanies() {
    const companies = await this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'id',
      'name',
      'taxId',
      'contactEmail',
      'phone',
      'address',
      'website',
      'description',
      'status',
      'createdAt',
    ];

    const escape = (value: unknown) => {
      if (value === null || typeof value === 'undefined') {
        return '';
      }
      const str =
        value instanceof Date ? value.toISOString() : String(value);
      const escaped = str.replace(/"/g, '""').replace(/\r?\n/g, ' ');
      return `"${escaped}"`;
    };

    const lines = companies.map((company) => {
      const row = [
        escape(company.id),
        escape(company.name),
        escape(company.taxId),
        escape(company.contactEmail),
        escape(company.phone),
        escape(company.address),
        escape(company.website),
        escape(company.description),
        escape(company.status),
        escape(company.createdAt),
      ];
      return row.join(',');
    });

    return [headers.join(','), ...lines].join('\n');
  }
}
