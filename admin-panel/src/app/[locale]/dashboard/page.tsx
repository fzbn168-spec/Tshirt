
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
    { name: t('inquiries'), value: '12', icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', href: '/dashboard/inquiries' },
    { name: t('orders'), value: '5', icon: ShoppingCart, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', href: '/dashboard/orders' },
    { name: t('productMgmt'), value: '128', icon: Package, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', href: '/dashboard/products' },
    { name: t('companyTitle'), value: '45', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', href: '/dashboard/companies' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{t('title')}</h1>
        <p className="text-zinc-500 mt-2">{t('subtitle')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Link key={stat.name} href={stat.href} className="block group">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm group-hover:border-blue-500 transition-colors cursor-pointer">
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
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">{t('quickActions')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/dashboard/products" className="group block p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-blue-500 transition-colors">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-lg">{t('productMgmt')}</h3>
          </div>
          <p className="text-zinc-500 text-sm">{t('productDesc')}</p>
        </Link>

        <Link href="/dashboard/orders" className="group block p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-green-500 transition-colors">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg group-hover:bg-green-100 dark:group-hover:bg-green-900/40 transition-colors">
              <ShoppingCart className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-lg">{t('orders')}</h3>
          </div>
          <p className="text-zinc-500 text-sm">{t('ordersDesc')}</p>
        </Link>

        <Link href="/dashboard/inquiries" className="group block p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-orange-500 transition-colors">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg group-hover:bg-orange-100 dark:group-hover:bg-orange-900/40 transition-colors">
              <MessageSquare className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="font-semibold text-lg">{t('inquiryMgmt')}</h3>
          </div>
          <p className="text-zinc-500 text-sm">{t('inquiryDesc')}</p>
        </Link>

        <Link href="/dashboard/companies" className="group block p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-purple-500 transition-colors">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40 transition-colors">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-lg">{t('companyTitle')}</h3>
          </div>
          <p className="text-zinc-500 text-sm">{t('companySubtitle')}</p>
        </Link>
      </div>
    </div>
  );
}
