'use client';

import { Truck, ShieldCheck, Box, PenTool } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function ServiceBlock() {
  const t = useTranslations('Product.service');

  const services = [
    { icon: Truck, label: t('shipping'), color: 'text-blue-600' },
    { icon: Box, label: t('sample'), color: 'text-amber-600' },
    { icon: ShieldCheck, label: t('payment'), color: 'text-green-600' },
    { icon: PenTool, label: t('customization'), color: 'text-purple-600' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
      {services.map((service, index) => (
        <div key={index} className="flex items-center gap-3">
          <service.icon className={`w-5 h-5 ${service.color}`} />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {service.label}
          </span>
        </div>
      ))}
    </div>
  );
}
