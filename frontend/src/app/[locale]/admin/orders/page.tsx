'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslations } from 'next-intl';

interface Order {
  id: string;
  orderNo: string;
  status: string;
  totalAmount: string;
  currency: string;
  createdAt: string;
  user: { email: string };
}

export default function AdminOrdersPage() {
  const { token } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const t = useTranslations('Admin');

  useEffect(() => {
    fetch('http://localhost:3001/orders', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
         // Assuming PLATFORM_ADMIN sees all orders
         setOrders(Array.isArray(data) ? data : data.data || []);
      })
      .catch(console.error);
  }, [token]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('orderListTitle')}</h1>
      <div className="rounded-md border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b">
            <tr>
              <th className="h-12 px-4 text-left font-medium">{t('table.orderNo')}</th>
              <th className="h-12 px-4 text-left font-medium">{t('table.date')}</th>
              <th className="h-12 px-4 text-left font-medium">{t('table.customer')}</th>
              <th className="h-12 px-4 text-left font-medium">{t('table.amount')}</th>
              <th className="h-12 px-4 text-left font-medium">{t('table.status')}</th>
              <th className="h-12 px-4 text-left font-medium">{t('table.action')}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b hover:bg-zinc-50">
                <td className="p-4">{order.orderNo}</td>
                <td className="p-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="p-4">{order.user.email}</td>
                <td className="p-4">{order.currency} {order.totalAmount}</td>
                <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        order.status === 'PENDING_PAYMENT' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'SHIPPED' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                        {t(`status.${order.status}`)}
                    </span>
                </td>
                <td className="p-4">
                  <Link href={`/admin/orders/${order.id}`} className="text-blue-600 hover:underline">
                    {t('actions.manageShip')}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
