'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, TrendingUp, ShoppingCart, CreditCard, Eye } from 'lucide-react';
import api from '@/lib/axios';

interface FunnelData {
  step: string;
  count: number;
}

interface AnalyticsData {
  funnel: FunnelData[];
  period: {
    start: string;
    end: string;
  };
}

export default function AnalyticsPage() {
  const { isAuthenticated } = useAuthStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false); // Start false until dates are set
  
  // Date range state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Initialize dates on mount
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!startDate || !endDate) return;
      
      setLoading(true);
      try {
        const query = new URLSearchParams({
            startDate,
            endDate
        }).toString();

        const res = await api.get(`/analytics/funnel?${query}`);
        setData(res.data);
      } catch (error) {
        console.error('Failed to fetch analytics', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated() && startDate && endDate) {
      fetchAnalytics();
    }
  }, [isAuthenticated, startDate, endDate]);

  if (loading && !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const getConversionRate = (stepIndex: number) => {
    if (!data) return '0%';
    if (stepIndex === 0) return '100%';
    const prev = data.funnel[stepIndex - 1].count;
    const curr = data.funnel[stepIndex].count;
    if (prev === 0) return '0%';
    return `${((curr / prev) * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Analytics Dashboard</h1>
        
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <span className="text-sm text-zinc-500 font-medium px-2">Period:</span>
            <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none"
            />
            <span className="text-zinc-400">-</span>
            <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none"
            />
        </div>
      </div>

      {data ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
             {/* Stats Cards */}
             <StatsCard 
                title="Total Views" 
                value={data.funnel.find(f => f.step === 'Product View')?.count || 0}
                icon={Eye}
                color="text-blue-600"
                bg="bg-blue-100 dark:bg-blue-900/20"
             />
             <StatsCard 
                title="Add to Cart" 
                value={data.funnel.find(f => f.step === 'Add to Cart')?.count || 0}
                icon={ShoppingCart}
                color="text-purple-600"
                bg="bg-purple-100 dark:bg-purple-900/20"
             />
             <StatsCard 
                title="Checkouts" 
                value={data.funnel.find(f => f.step === 'Checkout')?.count || 0}
                icon={CreditCard}
                color="text-orange-600"
                bg="bg-orange-100 dark:bg-orange-900/20"
             />
             <StatsCard 
                title="Purchases" 
                value={data.funnel.find(f => f.step === 'Purchase')?.count || 0}
                icon={TrendingUp}
                color="text-green-600"
                bg="bg-green-100 dark:bg-green-900/20"
             />
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Conversion Funnel</h2>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.funnel} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="step" tick={{fill: '#6b7280'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill: '#6b7280'}} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

           {/* Detailed Breakdown Table */}
           <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-3 font-medium">Stage</th>
                  <th className="px-6 py-3 font-medium">Users</th>
                  <th className="px-6 py-3 font-medium">Conversion Rate</th>
                  <th className="px-6 py-3 font-medium">Drop-off</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {data.funnel.map((step, index) => {
                   const conversion = getConversionRate(index);
                   const dropOff = index === 0 ? '-' : `${(100 - parseFloat(conversion)).toFixed(1)}%`;
                   
                   return (
                    <tr key={step.step} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{step.step}</td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{step.count}</td>
                      <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            parseFloat(conversion) > 50 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        }`}>
                            {conversion}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-500 dark:text-zinc-500">{dropOff}</td>
                    </tr>
                   );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-zinc-500">
            No analytics data available for this period.
        </div>
      )}
    </div>
  );
}

function StatsCard({ title, value, icon: Icon, color, bg }: { title: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }) {
    return (
        <div className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-sm transition-all hover:shadow-md">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${bg}`}>
                <Icon className={`h-6 w-6 ${color}`} />
            </div>
            <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
            </div>
        </div>
    );
}
