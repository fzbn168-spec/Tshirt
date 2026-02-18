'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from '@/navigation';
import api from '@/lib/axios';
import { useTranslations } from 'next-intl';
import { Loader2, Package, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/button';
import Link from 'next/link';

interface Order {
  id: string;
  orderNo: string;
  totalAmount: number;
  status: string;
  type: string;
  createdAt: string;
  company: {
    name: string;
    contactEmail: string;
  };
  user: {
    fullName: string;
    email: string;
  };
}

export default function OrdersPage() {
  const t = useTranslations('Admin');
  const router = useRouter();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await api.get('/platform/orders');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            {t('orderMgmt')}
          </h1>
          <p className="text-zinc-500">Manage all orders</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">Order No</th>
              <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">Type</th>
              <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">Customer</th>
              <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">Amount</th>
              <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">Date</th>
              <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">Status</th>
              <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {orders?.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">
                  No orders found.
                </td>
              </tr>
            ) : (
              orders?.map((order: Order) => (
                <tr key={order.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{order.orderNo}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border",
                      order.type === 'SAMPLE' 
                        ? "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800" 
                        : "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                    )}>
                      {order.type || 'STANDARD'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{order.company?.name}</div>
                    <div className="text-xs text-zinc-500">{order.user?.fullName}</div>
                  </td>
                  <td className="px-6 py-4 font-medium">
                    ${Number(order.totalAmount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-zinc-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                      order.status === 'PENDING_PAYMENT' ? "bg-yellow-100 text-yellow-700" :
                      order.status === 'PAID' ? "bg-green-100 text-green-700" :
                      order.status === 'SHIPPED' ? "bg-blue-100 text-blue-700" :
                      "bg-zinc-100 text-zinc-700"
                    )}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/dashboard/orders/${order.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
