'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2, Plus, RefreshCw, Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

interface ExchangeRate {
  id: string;
  currency: string;
  rate: number;
  updatedAt: string;
}

export default function ExchangeRatesPage() {
  const t = useTranslations('Admin.exchangeRates');
  const { token } = useAuthStore();
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCurrency, setNewCurrency] = useState({ currency: '', rate: '' });

  const fetchRates = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/exchange-rates`);
      if (res.ok) {
        const data = await res.json();
        setRates(data);
      }
    } catch (error) {
      console.error('Failed to fetch rates', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleUpdate = async (currency: string, rate: number) => {
    setSaving(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/exchange-rates`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currency, rate }),
      });

      if (res.ok) {
        fetchRates();
      }
    } catch (error) {
      console.error('Failed to update rate', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
        <Button onClick={fetchRates} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('refresh')}
        </Button>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-lg border shadow-sm">
        <div className="p-6">
          <div className="grid gap-6">
            {/* Add New */}
            <div className="flex gap-4 items-end border-b pb-6">
              <div className="grid gap-2 flex-1">
                <label className="text-sm font-medium">{t('code')}</label>
                <Input 
                  placeholder="USD, EUR, CNY..." 
                  value={newCurrency.currency}
                  onChange={(e) => setNewCurrency({...newCurrency, currency: e.target.value.toUpperCase()})}
                />
              </div>
              <div className="grid gap-2 flex-1">
                <label className="text-sm font-medium">{t('rate')}</label>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder={t('ratePlaceholder')}
                  value={newCurrency.rate}
                  onChange={(e) => setNewCurrency({...newCurrency, rate: e.target.value})}
                />
              </div>
              <Button onClick={() => handleUpdate(newCurrency.currency, parseFloat(newCurrency.rate))} disabled={!newCurrency.currency || !newCurrency.rate || saving}>
                <Plus className="w-4 h-4 mr-2" />
                {t('addCurrency')}
              </Button>
            </div>

            {/* List */}
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid gap-4">
                {rates.map((rate) => (
                  <div key={rate.id} className="flex items-center justify-between p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">
                        {rate.currency}
                      </div>
                      <div>
                        <div className="font-medium">{rate.currency}</div>
                        <div className="text-xs text-muted-foreground">Last updated: {new Date(rate.updatedAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="font-mono font-medium">{rate.rate.toFixed(4)}</div>
                      <Button variant="ghost" size="sm" onClick={() => {
                        const newRate = prompt(`Enter new rate for ${rate.currency}:`, rate.rate.toString());
                        if (newRate) handleUpdate(rate.currency, parseFloat(newRate));
                      }}>
                        {t('update')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
