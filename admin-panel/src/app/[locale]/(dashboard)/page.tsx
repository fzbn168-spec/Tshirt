
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { 
  Package, 
  ShoppingCart, 
  MessageSquare, 
  Users, 
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export default function AdminDashboardPage() {
  const t = useTranslations('Admin');

  const stats = [
    { name: 'Pending Inquiries', value: '12', icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { name: 'Pending Orders', value: '5', icon: ShoppingCart, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { name: 'Total Products', value: '128', icon: Package, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    { name: 'Active Companies', value: '45', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{t('title')}</h1>
        <p className="text-zinc-500 mt-2">Welcome to the Platform Administration Console.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <span className="text-xs font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full">
                +2.5%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{stat.value}</h3>
            <p className="text-sm text-zinc-500 mt-1">{stat.name}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/products" className="group block p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-blue-500 transition-colors">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 group-hover:bg-blue-100 transition-colors">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">{t('productTitle')}</h3>
          </div>
          <p className="text-sm text-zinc-500">{t('productSubtitle')}</p>
        </Link>

        <Link href="/inquiries" className="group block p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-orange-500 transition-colors">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 group-hover:bg-orange-100 transition-colors">
              <MessageSquare className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">{t('inquiryMgmt')}</h3>
          </div>
          <p className="text-sm text-zinc-500">{t('inquiryDesc')}</p>
        </Link>

        <Link href="/companies" className="group block p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-purple-500 transition-colors">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 group-hover:bg-purple-100 transition-colors">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white">{t('companyTitle')}</h3>
          </div>
          <p className="text-sm text-zinc-500">{t('companySubtitle')}</p>
        </Link>
      </div>
    </div>
  );
}
