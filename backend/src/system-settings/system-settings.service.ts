import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SystemSettingsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const defaults = [
      {
        key: 'weight_unit',
        value: 'kg',
        description: 'Unit for product weight',
      },
      {
        key: 'dimension_unit',
        value: 'cm',
        description: 'Unit for product dimensions',
      },
      { key: 'currency', value: 'USD', description: 'Default currency' },
    ];

    const settings = await this.prisma.systemSetting.findMany();

    const mergedDefaults = defaults.map((def) => {
      const stored = settings.find((s) => s.key === def.key);
      return stored || def;
    });

    const extraSettings = settings.filter(
      (s) => !defaults.find((def) => def.key === s.key),
    );

    return [...mergedDefaults, ...extraSettings];
  }

  async updateMany(
    settings: { key: string; value: string; description?: string }[],
  ) {
    const updates = settings.map((setting) =>
      this.prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value, description: setting.description },
        create: {
          key: setting.key,
          value: setting.value,
          description: setting.description,
        },
      }),
    );
    return Promise.all(updates);
  }
}
