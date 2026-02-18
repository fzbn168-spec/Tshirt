'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from '@/navigation';
import { useParams } from 'next/navigation';
import api from '@/lib/axios';
import { Loader2, ArrowLeft, Download, Package, User, CreditCard } from 'lucide-react';
import { Button } from '@/components/button';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface OrderItem {
  id: string;
  productName: string;
  skuSpecs: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: string;
  orderNo: string;
  totalAmount: number;
  status: string;
  type: string;
  createdAt: string;
  items: OrderItem[];
  company: {
    name: string;
    contactEmail: string;
    address?: string;
  };
  user: {
    fullName: string;
    email: string;
  };
}

export default function OrderDetailPage() {
  const t = useTranslations('Admin');
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const res = await api.get(`/platform/orders/${id}`);
      return res.data as Order;
    },
    enabled: !!id,
  });

  const handleDownload = async (docType: 'pi' | 'ci' | 'pl') => {
    try {
      const res = await api.get(`/platform/orders/${id}/${docType}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${docType.toUpperCase()}-${order?.orderNo}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download PDF', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">{order.orderNo}</h1>
          <span className={cn(
            "px-3 py-1 rounded-full text-xs font-bold border",
            order.type === 'SAMPLE' 
              ? "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800" 
              : "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
          )}>
            {order.type || 'STANDARD'}
          </span>
          <span className={cn(
            "px-3 py-1 rounded-full text-xs font-medium",
            order.status === 'PENDING_PAYMENT' ? "bg-yellow-100 text-yellow-700" :
            order.status === 'PAID' ? "bg-green-100 text-green-700" :
            order.status === 'SHIPPED' ? "bg-blue-100 text-blue-700" :
            "bg-zinc-100 text-zinc-700"
          )}>
            {order.status.replace('_', ' ')}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleDownload('pi')}>
            <Download className="h-4 w-4 mr-2" />
            PI
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDownload('ci')}>
            <Download className="h-4 w-4 mr-2" />
            CI
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDownload('pl')}>
            <Download className="h-4 w-4 mr-2" />
            PL
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50">
              <h2 className="font-semibold flex items-center gap-2">
                <Package className="h-4 w-4 text-zinc-500" />
                Order Items
              </h2>
            </div>
            <table className="w-full text-sm text-left">
              <thead className="text-zinc-500 font-medium bg-zinc-50 dark:bg-zinc-800/30">
                <tr>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3 text-right">Qty</th>
                  <th className="px-6 py-3 text-right">Unit Price</th>
                  <th className="px-6 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4">
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-xs text-zinc-500">{item.skuSpecs}</div>
                    </td>
                    <td className="px-6 py-4 text-right">{item.quantity}</td>
                    <td className="px-6 py-4 text-right">${Number(item.unitPrice).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-medium">
                      ${Number(item.totalPrice).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-4 bg-zinc-50/50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
              <div className="text-lg font-bold">
                Total: ${Number(order.totalAmount).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-zinc-500" />
              Customer Details
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-zinc-500 block">Company</span>
                <span className="font-medium">{order.company.name}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Contact</span>
                <span className="font-medium">{order.user.fullName}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Email</span>
                <span className="font-medium">{order.user.email}</span>
              </div>
              {order.company.address && (
                <div>
                  <span className="text-zinc-500 block">Address</span>
                  <span className="font-medium">{order.company.address}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-zinc-500" />
              Payment Info
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-zinc-500 block">Status</span>
                <span className="font-medium capitalize">{order.status.replace('_', ' ').toLowerCase()}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Date</span>
                <span className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
