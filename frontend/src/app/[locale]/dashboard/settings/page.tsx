'use client';

import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { useEffect } from 'react';

export default function SettingsPage() {
  const t = useTranslations('Settings');
  const { currency, setCurrency, fetchRates, rates } = useCurrencyStore();

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-lg border shadow-sm">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="font-semibold text-lg">{t('preferences')}</h2>
        </div>
        <div className="p-6 space-y-6">
          {/* Language Setting */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="font-medium">{t('language')}</div>
              <div className="text-sm text-zinc-500">{t('languageDesc')}</div>
            </div>
            <div>
              <LanguageSwitcher />
            </div>
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800"></div>

          {/* Currency Setting */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="font-medium">{t('currency')}</div>
              <div className="text-sm text-zinc-500">{t('currencyDesc')}</div>
            </div>
            <div className="min-w-[120px]">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full appearance-none bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 py-2 pl-3 pr-8 rounded-md hover:border-zinc-300 dark:hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {Object.keys(rates).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Account Settings Placeholder */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border shadow-sm opacity-50">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="font-semibold text-lg">{t('account')}</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="font-medium">{t('changePassword')}</div>
            </div>
            <button disabled className="px-4 py-2 bg-zinc-100 text-zinc-400 rounded-md text-sm cursor-not-allowed">
              Coming Soon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
