'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslations } from 'next-intl';

interface OrderItem {
    id: string;
    productName: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
}

interface Payment {
    id: string;
    amount: string;
    method: string;
    status: string;
    proofUrl?: string;
    createdAt: string;
}

interface Order {
    id: string;
    orderNo: string;
    status: string;
    totalAmount: string;
    currency: string;
    items: OrderItem[];
    user: { email: string };
    shippings: { trackingNo: string; carrier: string; shippedAt: string }[];
    payments: Payment[];
}

export default function AdminOrderDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { token } = useAuthStore();
    const [order, setOrder] = useState<Order | null>(null);
    const [trackingNo, setTrackingNo] = useState('');
    const [carrier, setCarrier] = useState('DHL');
    const t = useTranslations('Admin');

    const fetchOrder = useCallback(() => {
        fetch(`http://localhost:3001/orders/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(setOrder)
        .catch(console.error);
    }, [id, token]);

    useEffect(() => {
        fetchOrder();
    }, [fetchOrder]);

    const handleApprovePayment = async (paymentId: string) => {
        if (!confirm('Approve this payment?')) return;
        try {
            const res = await fetch(`http://localhost:3001/payments/${paymentId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'COMPLETED' })
            });
            if (res.ok) {
                alert('Payment Approved');
                fetchOrder();
            } else {
                alert('Failed to approve');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleShip = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:3001/shippings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    orderId: id,
                    trackingNo,
                    carrier
                })
            });

            if (res.ok) {
                alert(t('alerts.shippingSuccess'));
                router.refresh();
                fetchOrder();
            } else {
                const err = await res.json();
                alert(t('alerts.error') + ': ' + JSON.stringify(err));
            }
        } catch (e) {
            console.error(e);
            alert(t('alerts.error'));
        }
    };

    if (!order) return <div>{t('loading')}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">{t('details.manageOrder')}: {order.orderNo}</h1>
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold">{t(`status.${order.status}`)}</span>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded border space-y-4">
                        <h2 className="text-xl font-semibold">{t('details.orderDetails')}</h2>
                        <p><strong>{t('details.user')}:</strong> {order.user.email}</p>
                        <p><strong>{t('details.total')}:</strong> {order.currency} {order.totalAmount}</p>
                        <div className="border-t pt-4">
                            <h3 className="font-medium mb-2">{t('details.items')}:</h3>
                            {order.items.map(item => (
                                <div key={item.id} className="flex justify-between text-sm py-1">
                                    <span>{item.productName} x {item.quantity}</span>
                                    <span>{order.currency} {item.totalPrice}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded border space-y-4">
                        <h2 className="text-xl font-semibold">Payment Management</h2>
                        {order.payments && order.payments.length > 0 ? (
                            <div className="space-y-4">
                                {order.payments.map(payment => (
                                    <div key={payment.id} className="border p-4 rounded flex justify-between items-center">
                                        <div className="text-sm">
                                            <p><strong>Amount:</strong> {order.currency} {payment.amount}</p>
                                            <p><strong>Method:</strong> {payment.method}</p>
                                            <p><strong>Date:</strong> {new Date(payment.createdAt).toLocaleString()}</p>
                                            {payment.proofUrl && (
                                                <p><strong>Proof:</strong> <a href={payment.proofUrl} target="_blank" className="text-blue-600 underline hover:text-blue-800">View Receipt</a></p>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                                                payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100'
                                            }`}>
                                                {payment.status}
                                            </span>
                                            {payment.status === 'PENDING' && (
                                                <button 
                                                    onClick={() => handleApprovePayment(payment.id)}
                                                    className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                                                >
                                                    Approve
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-zinc-500 text-sm">No payments recorded.</p>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded border space-y-4 h-fit">
                    <h2 className="text-xl font-semibold">{t('details.shippingMgmt')}</h2>
                    
                    {order.shippings && order.shippings.length > 0 ? (
                        <div className="space-y-2">
                            <h3 className="font-medium">{t('details.shippingHistory')}:</h3>
                            {order.shippings.map((ship, idx) => (
                                <div key={idx} className="bg-zinc-50 p-3 rounded text-sm">
                                    <p><strong>{t('details.tracking')}:</strong> {ship.trackingNo}</p>
                                    <p><strong>{t('details.carrier')}:</strong> {ship.carrier}</p>
                                    <p><strong>{t('details.date')}:</strong> {new Date(ship.shippedAt).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-zinc-500 text-sm">{t('details.noShipping')}</p>
                    )}

                    {(order.status === 'PROCESSING' || order.status === 'PENDING_PAYMENT') && (
                        <form onSubmit={handleShip} className="border-t pt-4 space-y-4 mt-4">
                            <h3 className="font-medium">{t('details.createShipment')}</h3>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('details.carrier')}</label>
                                <select 
                                    className="w-full border p-2 rounded"
                                    value={carrier}
                                    onChange={e => setCarrier(e.target.value)}
                                >
                                    <option value="DHL">DHL</option>
                                    <option value="UPS">UPS</option>
                                    <option value="FedEx">FedEx</option>
                                    <option value="SF Express">SF Express</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('details.trackingNo')}</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full border p-2 rounded"
                                    value={trackingNo}
                                    onChange={e => setTrackingNo(e.target.value)}
                                    placeholder={t('details.enterTracking')}
                                />
                            </div>
                            <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">
                                {t('details.shipOrder')}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
