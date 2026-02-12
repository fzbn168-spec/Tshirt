'use client';

import { Link, usePathname, useRouter } from '@/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('Admin');
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (user?.role !== 'PLATFORM_ADMIN') {
      // Security Fix: Strictly redirect non-platform-admins to buyer dashboard
      // Previously allowed 'ADMIN' (Company Admin), which caused the security breach
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  // Security Fix: Double check in render to prevent flash of content
  if (!isAuthenticated || user?.role !== 'PLATFORM_ADMIN') {
    return null;
  }

  const navigation = [
    { name: t('dashboard'), href: '/admin' },
    { name: t('inquiries'), href: '/admin/inquiries' },
    { name: t('orders'), href: '/admin/orders' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-900">
      <header className="sticky top-0 z-40 border-b bg-white dark:bg-zinc-950">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex gap-6 md:gap-10">
            <Link href="/admin" className="flex items-center space-x-2">
              <span className="inline-block font-bold bg-red-600 text-white px-2 py-1 rounded">{t('adminLabel')}</span>
            </Link>
            <nav className="flex gap-6">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center text-sm font-medium transition-colors hover:text-foreground/80 ${
                    pathname === item.href ? 'text-foreground' : 'text-foreground/60'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
             <Link href="/dashboard" className="text-sm font-medium text-blue-600 hover:underline">
                {t('backToUser')}
             </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 container py-6">
        {children}
      </main>
    </div>
  );
}
