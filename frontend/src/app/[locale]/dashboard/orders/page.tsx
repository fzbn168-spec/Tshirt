'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PaymentModal } from '@/components/orders/PaymentModal';
import api from '@/lib/api';

interface OrderItem {
  id: string;
  productName: string;
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
  type?: string;
}

export default function OrdersPage() {
  const { token, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [exportingOrders, setExportingOrders] = useState(false);
  const [exportingPayments, setExportingPayments] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders');
        setOrders(res.data);
      } catch (error) {
        console.error('Failed to fetch orders', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, token, router]);

  if (loading) {
    return <div className="p-8">Loading orders...</div>;
  }

  const handleExport = async () => {
    try {
      setExportingOrders(true);
      const res = await api.get('/orders/export', {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'orders-history.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error(e);
      alert('Export failed');
    } finally {
      setExportingOrders(false);
    }
  };

  const handleExportPayments = async () => {
    try {
      setExportingPayments(true);
      const res = await api.get('/payments/export/orders', {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'payments-history.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error(e);
      alert('Export failed');
    } finally {
      setExportingPayments(false);
    }
  };

  const openPayModal = (order: Order) => {
    setSelectedOrder(order);
    setIsPayModalOpen(true);
  };

  const handlePaymentSubmit = async (method: string, proofUrl?: string) => {
    if (!selectedOrder) return;

    try {
        await api.post('/payments', {
          orderId: selectedOrder.id,
          amount: Number(selectedOrder.totalAmount),
          method,
          proofUrl
        });
        alert('Payment Submitted Successfully!');
        // Refetch orders
        const res = await api.get('/orders');
        setOrders(res.data);
    } catch (e) {
        console.error(e);
        alert('Payment Error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exportingOrders}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 h-9 px-4"
          >
            {exportingOrders ? 'Exporting Orders...' : 'Export Orders CSV'}
          </button>
          <button
            onClick={handleExportPayments}
            disabled={exportingPayments}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 h-9 px-4"
          >
            {exportingPayments ? 'Exporting Payments...' : 'Export Payments CSV'}
          </button>
        </div>
      </div>

      <div className="rounded-md border bg-white dark:bg-zinc-950">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Order No</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Source</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Total Amount</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-muted-foreground">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-medium">{order.orderNo}</td>
                    <td className="p-4 align-middle">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border ${
                        order.type === 'SAMPLE' 
                          ? "bg-purple-100 text-purple-700 border-purple-200" 
                          : "bg-blue-100 text-blue-700 border-blue-200"
                      }`}>
                        {order.type || 'STANDARD'}
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 align-middle">
                      {order.inquiry ? (
                        <span className="text-blue-600">RFQ: {order.inquiry.inquiryNo}</span>
                      ) : (
                        <span className="text-zinc-500">Direct</span>
                      )}
                    </td>
                    <td className="p-4 align-middle font-medium">
                      {order.currency} {Number(order.totalAmount).toFixed(2)}
                    </td>
                    <td className="p-4 align-middle">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="p-4 align-middle flex items-center gap-2">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
                      >
                        View
                      </Link>
                      {order.status === 'PENDING_PAYMENT' && (
                          <button
                            onClick={() => openPayModal(order)}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-8 px-3"
                          >
                            Pay Now
                          </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <PaymentModal 
            isOpen={isPayModalOpen}
            onClose={() => setIsPayModalOpen(false)}
            onSubmit={handlePaymentSubmit}
            amount={Number(selectedOrder.totalAmount)}
            currency={selectedOrder.currency}
            orderId={selectedOrder.id}
        />
      )}
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
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
        styles[status] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {label}
    </span>
  );
}
