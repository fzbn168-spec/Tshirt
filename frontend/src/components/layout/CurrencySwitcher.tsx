'use client';

import { useEffect } from 'react';
import { useCurrencyStore } from '@/store/useCurrencyStore';
import { ChevronDown } from 'lucide-react';

export function CurrencySwitcher() {
  const { currency, setCurrency, fetchRates, rates } = useCurrencyStore();

  useEffect(() => {
    fetchRates();
  }, []);

  const currencies = Object.keys(rates);

  return (
    <div className="relative group">
      <button className="flex items-center gap-1 text-sm font-medium hover:text-blue-600 transition-colors">
        {currency}
        <ChevronDown className="w-3 h-3" />
      </button>
      
      <div className="absolute right-0 top-full pt-2 hidden group-hover:block z-50">
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg py-1 min-w-[80px]">
          {currencies.map(c => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 ${
                currency === c ? 'text-blue-600 font-medium' : 'text-zinc-700 dark:text-zinc-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
