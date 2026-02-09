'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2, ArrowLeft, Package, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface OrderItem {
  productId: string;
  skuId?: string;
  productName: string;
  skuSpecs?: string;
  quantity: number;
  unitPrice: number;
}

export default function CreateOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inquiryId = searchParams.get('inquiryId');
  const { token } = useAuthStore();
  
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(!!inquiryId);
  const [error, setError] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (inquiryId && token) {
      fetchInquiryDetails();
    }
  }, [inquiryId, token]);

  const fetchInquiryDetails = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/inquiries/${inquiryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load inquiry details');
      
      const data = await res.json();
      
      // Transform inquiry items to order items
      const orderItems = data.items.map((item: any) => ({
        productId: item.productId,
        skuId: item.skuId,
        productName: item.productName,
        skuSpecs: item.skuSpecs,
        quantity: item.quantity,
        unitPrice: Number(item.quotedPrice || item.targetPrice || 0) // Prefer quoted price
      }));

      setItems(orderItems);
      calculateTotal(orderItems);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setInitLoading(false);
    }
  };

  const calculateTotal = (currentItems: OrderItem[]) => {
    const total = currentItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    setTotalAmount(total);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      const payload = {
        inquiryId: inquiryId || undefined,
        items: items
      };

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to create order');
      }

      const order = await res.json();
      router.push(`/dashboard/orders?success=true&orderNo=${order.orderNo}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (initLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold tracking-tight">Create Order</h1>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50">
              <h2 className="font-semibold flex items-center gap-2">
                <Package className="w-4 h-4 text-zinc-500" />
                Order Items
              </h2>
            </div>
            <div className="overflow-x-auto">
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
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-xs text-zinc-500">{item.skuSpecs}</div>
                      </td>
                      <td className="px-6 py-4 text-right">{item.quantity}</td>
                      <td className="px-6 py-4 text-right">${item.unitPrice.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right font-medium">
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
            <h3 className="font-medium text-lg">Order Summary</h3>
            
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Subtotal</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Shipping</span>
              <span className="text-zinc-400 italic">Calculated later</span>
            </div>
            
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || items.length === 0}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Confirm Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
