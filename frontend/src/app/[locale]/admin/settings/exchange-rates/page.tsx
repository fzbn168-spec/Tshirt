'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Save, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ExchangeRate {
  id?: string;
  currency: string;
  rate: number;
  updatedAt?: string;
}

export default function ExchangeRatesPage() {
  const t = useTranslations('Admin');
  const { token } = useAuthStore();
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // New rate form
  const [newCurrency, setNewCurrency] = useState('');
  const [newRate, setNewRate] = useState('');

  const fetchRates = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/exchange-rates');
      if (res.ok) {
        const data = await res.json();
        setRates(data);
      }
    } catch (err) {
      console.error(err);
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
      const res = await fetch('http://localhost:3001/exchange-rates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currency, rate })
      });
      
      if (res.ok) {
        // Refresh
        fetchRates();
        // Clear inputs if it was new
        if (currency === newCurrency) {
            setNewCurrency('');
            setNewRate('');
        }
      } else {
        alert('Failed to update rate');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating rate');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Exchange Rates</h2>
        <p className="text-zinc-500">Manage currency exchange rates relative to USD (Base Currency).</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden p-6">
        
        {/* List */}
        <div className="space-y-4 mb-8">
            <h3 className="font-medium text-zinc-900 dark:text-zinc-100">Current Rates (1 USD = )</h3>
            {loading ? (
                <div>Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
                        <span className="font-bold">USD (Base)</span>
                        <span className="font-mono">1.0000</span>
                    </div>
                    {rates.filter(r => r.currency !== 'USD').map(rate => (
                        <div key={rate.currency} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-700">
                             <span className="font-bold">{rate.currency}</span>
                             <div className="flex items-center gap-2">
                                <input 
                                    type="number" 
                                    step="0.0001"
                                    defaultValue={rate.rate}
                                    onBlur={(e) => {
                                        const val = parseFloat(e.target.value);
                                        if (val !== rate.rate) handleUpdate(rate.currency, val);
                                    }}
                                    className="w-24 px-2 py-1 text-right border rounded bg-transparent"
                                />
                                <span className="text-xs text-zinc-400">
                                    {new Date(rate.updatedAt!).toLocaleDateString()}
                                </span>
                             </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Add New */}
        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
             <h3 className="font-medium text-zinc-900 dark:text-zinc-100 mb-4">Add New Currency</h3>
             <div className="flex gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium mb-1">Currency Code (e.g. GBP)</label>
                    <input 
                        type="text" 
                        value={newCurrency}
                        onChange={e => setNewCurrency(e.target.value.toUpperCase())}
                        maxLength={3}
                        className="w-32 px-3 py-2 border rounded-md uppercase"
                        placeholder="GBP"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Rate (1 USD = ?)</label>
                    <input 
                        type="number" 
                        step="0.0001"
                        value={newRate}
                        onChange={e => setNewRate(e.target.value)}
                        className="w-32 px-3 py-2 border rounded-md"
                        placeholder="0.75"
                    />
                </div>
                <button 
                    onClick={() => handleUpdate(newCurrency, parseFloat(newRate))}
                    disabled={!newCurrency || !newRate || saving}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                    <Plus className="w-4 h-4" />
                    Add Rate
                </button>
             </div>
        </div>
      </div>
    </div>
  );
}
