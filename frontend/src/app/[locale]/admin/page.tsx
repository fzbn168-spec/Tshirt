'use client';

import { Link } from '@/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslations } from 'next-intl';

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const t = useTranslations('Admin');

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/admin/inquiries" className="block p-6 bg-white border rounded-lg hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-2 text-blue-600">{t('inquiryMgmt')}</h2>
          <p className="text-zinc-600">{t('inquiryDesc')}</p>
        </Link>

        <Link href="/admin/orders" className="block p-6 bg-white border rounded-lg hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-2 text-purple-600">{t('orderMgmt')}</h2>
          <p className="text-zinc-600">{t('orderDesc')}</p>
        </Link>
        
        <Link href="/admin/products" className="block p-6 bg-white border rounded-lg hover:shadow-md transition-shadow">
           <h2 className="text-xl font-semibold mb-2 text-green-600">{t('productMgmt')}</h2>
           <p className="text-zinc-600">{t('productDesc')}</p>
        </Link>
      </div>
    </div>
  );
}
