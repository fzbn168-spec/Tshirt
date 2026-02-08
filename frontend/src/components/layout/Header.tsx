'use client';

import { Link } from '@/navigation';
import { Search, ShoppingBag, User, Menu, LayoutDashboard, Bell } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from './LanguageSwitcher';
import { CurrencySwitcher } from './CurrencySwitcher';
import { useNotifications } from '@/hooks/useNotifications';

export function Header() {
  const t = useTranslations('Common');
  const tNav = useTranslations('Nav');
  const tHome = useTranslations('Home');
  const totalItems = useCartStore(state => state.totalItems());
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const { unreadCount } = useNotifications();

  // Prevent hydration mismatch for persisted store
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-zinc-950 dark:border-zinc-800">
      {/* Top Bar - B2B Info */}
      <div className="bg-zinc-900 text-white text-xs py-2 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <p>{tHome('heroTitle')}</p>
          <div className="flex items-center gap-4">
            <span className="cursor-pointer hover:text-zinc-300">{t('moqPolicy')}</span>
            <span className="cursor-pointer hover:text-zinc-300">{t('shippingInfo')}</span>
            {(user?.role === 'ADMIN' || user?.role === 'PLATFORM_ADMIN') && (
               <Link href="/admin" className="font-bold text-red-400 hover:text-red-300">
                   {t('adminPortal')}
               </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <button className="lg:hidden p-2">
            <Menu className="h-6 w-6" />
          </button>
          <Link href="/" className="text-2xl font-bold tracking-tight">
            SOLE<span className="text-blue-600">TRADE</span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
          <Link href="/products?search=Men" className="hover:text-blue-600 transition-colors">{tNav('men')}</Link>
          <Link href="/products?search=Women" className="hover:text-blue-600 transition-colors">{tNav('women')}</Link>
          <Link href="/products?search=Kids" className="hover:text-blue-600 transition-colors">{tNav('kids')}</Link>
          <Link href="/products?search=Apparel" className="hover:text-blue-600 transition-colors">{tNav('apparel')}</Link>
          <Link href="/products?sort=newest" className="text-blue-600">{tNav('newArrivals')}</Link>
        </nav>

        {/* Icons / Actions */}
        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder={t('searchPlaceholder')} 
              className="h-9 w-64 rounded-md border border-zinc-200 bg-zinc-50 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-900"
            />
          </div>
          
          <CurrencySwitcher />
          <LanguageSwitcher />

          {isAuthenticated() && mounted && (
            <Link href="/dashboard/notifications" className="relative p-2 hover:bg-zinc-100 rounded-full dark:hover:bg-zinc-800">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 h-4 w-4 bg-red-600 text-white text-[10px] flex items-center justify-center rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )}
          
          <Link href="/rfq-cart" className="relative p-2 hover:bg-zinc-100 rounded-full dark:hover:bg-zinc-800">
            <ShoppingBag className="h-5 w-5" />
            {mounted && totalItems > 0 && (
              <span className="absolute top-0 right-0 h-4 w-4 bg-blue-600 text-white text-[10px] flex items-center justify-center rounded-full">
                {totalItems}
              </span>
            )}
          </Link>
          
          {isAuthenticated() && mounted ? (
             <div className="flex items-center gap-2">
                <Link href="/dashboard" className="flex items-center gap-2 p-2 hover:bg-zinc-100 rounded-full dark:hover:bg-zinc-800">
                    <LayoutDashboard className="h-5 w-5" />
                    <span className="text-sm font-medium hidden md:block">{t('dashboard')}</span>
                </Link>
                {/* Logout could be in dashboard or dropdown, but keeping it simple */}
             </div>
          ) : (
            <Link href="/login" className="flex items-center gap-2 p-2 hover:bg-zinc-100 rounded-full dark:hover:bg-zinc-800">
                <User className="h-5 w-5" />
                <span className="text-sm font-medium hidden md:block">{t('signIn')}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
