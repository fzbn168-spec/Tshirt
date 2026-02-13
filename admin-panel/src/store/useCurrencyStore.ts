import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CurrencyStore {
  currency: string;
  rates: Record<string, number>;
  setCurrency: (currency: string) => void;
  fetchRates: () => Promise<void>;
  convert: (amount: number) => number;
  format: (amount: number) => string;
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set, get) => ({
      currency: 'USD',
      rates: { 
        USD: 1, 
        EUR: 0.92, 
        GBP: 0.79,
        CNY: 7.20,
        CAD: 1.35,
        AUD: 1.52
      }, // Default fallbacks

      setCurrency: (currency) => set({ currency }),

      fetchRates: async () => {
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
          const res = await fetch(`${API_URL}/exchange-rates`);
          if (res.ok) {
            const data = await res.json();
            // Convert array [{currency: 'EUR', rate: 0.9}] to object {EUR: 0.9}
            const ratesMap: Record<string, number> = { USD: 1 };
            data.forEach((r: any) => {
              ratesMap[r.currency] = Number(r.rate);
            });
            set({ rates: ratesMap });
          }
        } catch (err) {
          console.error('Failed to fetch exchange rates', err);
        }
      },

      convert: (amount) => {
        const { currency, rates } = get();
        const rate = rates[currency] || 1;
        return amount * rate;
      },

      format: (amount) => {
        const { currency, rates } = get();
        const rate = rates[currency] || 1;
        const value = amount * rate;
        
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency,
        }).format(value);
      }
    }),
    {
      name: 'currency-storage',
    }
  )
);
