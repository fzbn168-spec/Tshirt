'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  FileText, 
  Package, 
  Settings, 
  LogOut, 
  Users,
  Bell,
  Building2,
  Tags
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('Dashboard.sidebar');
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!isMounted || !isAuthenticated()) {
    return null; // Or a loading spinner
  }

  const navigation = [
    { name: t('overview'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('profile'), href: '/dashboard/profile', icon: Building2 },
    { name: t('inquiries'), href: '/dashboard/inquiries', icon: FileText },
    { name: t('orders'), href: '/dashboard/orders', icon: Package },
    { name: t('subAccounts'), href: '/dashboard/users', icon: Users },
    ...(user?.role === 'ADMIN' || user?.role === 'PLATFORM_ADMIN' ? [{ name: t('attributes'), href: '/dashboard/attributes', icon: Tags }] : []),
    { name: t('settings'), href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hidden md:flex flex-col fixed inset-y-0">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <Link href="/" className="text-xl font-bold tracking-tight">
            SOLE<span className="text-blue-600">TRADE</span>
            <span className="text-xs font-normal text-zinc-500 block mt-1">{t('enterpriseConsole')}</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20" 
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
              {user?.fullName?.substring(0, 2) || 'US'}
            </div>
            <div className="text-sm">
              <div className="font-medium">{user?.fullName || 'User'}</div>
              <div className="text-xs text-zinc-500 truncate max-w-[140px]">{user?.company?.name || 'Company'}</div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors dark:hover:bg-red-900/20"
          >
            <LogOut className="w-4 h-4" />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-8 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-lg font-semibold capitalize">
            {navigation.find(item => item.href === pathname)?.name || 'Dashboard'}
          </h1>
          <button className="p-2 text-zinc-500 hover:bg-zinc-100 rounded-full dark:hover:bg-zinc-800 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900"></span>
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
