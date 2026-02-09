'use client';

import { useEffect, useState, use } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Download, RefreshCw } from 'lucide-react';

interface OrderItem {
  id: string;
  productId: string;
  skuId: string | null;
  productName: string;
  skuSpecs: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: string;
  orderNo: string;
  totalAmount: number;
  currency: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
  inquiry?: {
    inquiryNo: string;
  };
  user: {
    fullName: string;
    email: string;
  };
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { token, isAuthenticated } = useAuthStore();
  const addItem = useCartStore(state => state.addItem);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchOrder = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${API_URL}/orders/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        } else {
          console.error('Order not found');
        }
      } catch (error) {
        console.error('Failed to fetch order', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, isAuthenticated, token, router]);

  const handleReorder = () => {
    if (!order) return;
    
    order.items.forEach(item => {
        if (item.productId && item.skuId) {
             addItem({
                id: `${item.productId}-${item.skuId}`,
                productId: item.productId,
                productName: item.productName,
                skuId: item.skuId,
                skuCode: '', // Might not be available in OrderItem, but RFQ cart handles it
                specs: item.skuSpecs || '',
                quantity: item.quantity,
                price: Number(item.unitPrice),
                image: '' // OrderItem doesn't store image, cart will show placeholder or we could fetch
             });
        }
    });

    router.push('/rfq-cart');
  };

  const handleDownloadPi = async () => {
    if (!order) return;
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/orders/${id}/pi`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!res.ok) {
        alert('Failed to download PI');
        return;
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PI-${order.orderNo}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed', error);
      alert('Download failed');
    }
  };

  if (loading) return <div className="p-8">Loading order details...</div>;
  if (!order) return <div className="p-8">Order not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/orders"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Orders
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Order {order.orderNo}</h1>
        <StatusBadge status={order.status} />
        
        <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleReorder}
              className="flex items-center gap-2 rounded-md bg-white border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              <RefreshCw className="h-4 w-4" />
              Re-order
            </button>
            <button
              onClick={handleDownloadPi}
              className="flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Download className="h-4 w-4" />
              Download PI
            </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Order Info */}
        <div className="rounded-lg border bg-white p-6 shadow-sm dark:bg-zinc-950">
          <h2 className="mb-4 text-lg font-semibold">Order Information</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order Date</span>
              <span>{new Date(order.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Source</span>
              <span>
                {order.inquiry ? `RFQ: ${order.inquiry.inquiryNo}` : 'Direct Purchase'}
              </span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-muted-foreground">Total Amount</span>
              <span className="text-lg">
                {order.currency} {Number(order.totalAmount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="rounded-lg border bg-white p-6 shadow-sm dark:bg-zinc-950">
          <h2 className="mb-4 text-lg font-semibold">Customer Information</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Placed By</span>
              <span>{order.user.fullName || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{order.user.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="rounded-lg border bg-white shadow-sm dark:bg-zinc-950">
        <div className="p-6 pb-0">
          <h2 className="text-lg font-semibold">Order Items</h2>
        </div>
        <div className="relative w-full overflow-auto p-6">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50">
                <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Product</th>
                <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Specs</th>
                <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">Price</th>
                <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">Qty</th>
                <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {order.items.map((item) => (
                <tr key={item.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-2 align-middle font-medium">{item.productName}</td>
                  <td className="p-2 align-middle text-muted-foreground">
                    {parseSpecs(item.skuSpecs)}
                  </td>
                  <td className="p-2 align-middle text-right">
                    {Number(item.unitPrice).toFixed(2)}
                  </td>
                  <td className="p-2 align-middle text-right">{item.quantity}</td>
                  <td className="p-2 align-middle text-right font-medium">
                    {Number(item.totalPrice).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING_PAYMENT: 'bg-yellow-100 text-yellow-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    SHIPPED: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };

  const label = status.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        styles[status] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {label}
    </span>
  );
}

function parseSpecs(specs: string | null) {
  if (!specs) return '-';
  try {
    const obj = JSON.parse(specs);
    // If it's an object like {color: "Red", size: "40"}, join values
    return Object.values(obj).join(' / ');
  } catch (e) {
    return specs;
  }
}
