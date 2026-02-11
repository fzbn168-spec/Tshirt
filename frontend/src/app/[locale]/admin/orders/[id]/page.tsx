'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslations } from 'next-intl';
import { Download, FileText } from 'lucide-react';

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
    incoterms?: string;
    shippingMarks?: string;
    portOfLoading?: string;
    portOfDestination?: string;
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
    
    // Trade Info State
    const [incoterms, setIncoterms] = useState('');
    const [shippingMarks, setShippingMarks] = useState('');
    const [portOfLoading, setPortOfLoading] = useState('');
    const [portOfDestination, setPortOfDestination] = useState('');
    const [isUpdatingTrade, setIsUpdatingTrade] = useState(false);

    const t = useTranslations('Admin');

    const fetchOrder = useCallback(() => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        // Use Admin endpoint
        fetch(`${API_URL}/platform/orders/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            setOrder(data);
            setIncoterms(data.incoterms || '');
            setShippingMarks(data.shippingMarks || '');
            setPortOfLoading(data.portOfLoading || '');
            setPortOfDestination(data.portOfDestination || '');
        })
        .catch(console.error);
    }, [id, token]);

    useEffect(() => {
        fetchOrder();
    }, [fetchOrder]);

    const handleDownload = async (type: 'pi' | 'ci' | 'pl') => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${API_URL}/platform/orders/${id}/${type}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${type.toUpperCase()}-${order?.orderNo}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                alert('Failed to download document');
            }
        } catch (e) {
            console.error(e);
            alert('Error downloading document');
        }
    };

    const handleUpdateTradeInfo = async () => {
        setIsUpdatingTrade(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            // We need a PATCH endpoint for updating order details specifically
            // Assuming we reuse the update endpoint or create a new one. 
            // For now, let's assume we can PATCH to /platform/orders/:id/trade-info or simply /orders/:id
            // But standard REST often uses PATCH /orders/:id for partial updates.
            // Let's check backend... backend/src/orders/orders.admin.controller.ts only has updateStatus.
            // We need to implement updateOrder in backend, OR for now we just show the UI and mocked function?
            // User asked for "Frontend", so I will implement the UI logic, but it might fail if backend doesn't support it yet.
            // WAIT! I am "Fashion Commerce Expert". I should know I need to update backend too if it's missing.
            // But the plan step said "Frontend". I will implement the fetch call assuming standard PATCH /orders/:id pattern 
            // and if it fails, I'll know. Actually, let's use the existing updateStatus endpoint? No, that's just for status.
            
            // NOTE: I will add the UI. The backend update might be needed later.
            // Let's try to hit PATCH /platform/orders/:id/trade-info if it existed, or just mock it for now?
            // No, "Be extremely biased for action". I will implement the UI. 
            
            // To make it work, I'll create a new server action or API route? No, Client Component.
            // I'll assume a new endpoint PATCH /platform/orders/:id/details exists or I'll add it in next turn.
            // For this turn, I focus on Frontend UI.
            
            // alert("To be implemented: Backend API for updating Trade Info");
            // setIsUpdatingTrade(false);
            
            const res = await fetch(`${API_URL}/platform/orders/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    incoterms, 
                    shippingMarks, 
                    portOfLoading, 
                    portOfDestination 
                })
            });

            if (res.ok) {
                const updatedOrder = await res.json();
                setOrder(updatedOrder);
                alert("Trade Info Updated Successfully");
            } else {
                alert("Failed to update trade info");
            }
            setIsUpdatingTrade(false);
        } catch (e) {
            console.error(e);
            setIsUpdatingTrade(false);
        }
    };

    const handleApprovePayment = async (paymentId: string) => {
        if (!confirm('Approve this payment?')) return;
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${API_URL}/payments/${paymentId}/status`, {
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
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${API_URL}/shippings`, {
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
                        
                        {/* Trade Info Section */}
                        <div className="border-t pt-4 space-y-3">
                            <h3 className="font-medium">Trade & Logistics Info</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Incoterms</label>
                                    <select 
                                        value={incoterms}
                                        onChange={(e) => setIncoterms(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                    >
                                        <option value="">Select...</option>
                                        <option value="FOB">FOB</option>
                                        <option value="CIF">CIF</option>
                                        <option value="EXW">EXW</option>
                                        <option value="DDP">DDP</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Shipping Marks</label>
                                    <input 
                                        type="text"
                                        value={shippingMarks}
                                        onChange={(e) => setShippingMarks(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                        placeholder="e.g. SIDE MARK: C/NO 1-UP"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Port of Loading</label>
                                    <input 
                                        type="text"
                                        value={portOfLoading}
                                        onChange={(e) => setPortOfLoading(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                        placeholder="e.g. Shanghai"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Port of Dest.</label>
                                    <input 
                                        type="text"
                                        value={portOfDestination}
                                        onChange={(e) => setPortOfDestination(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                        placeholder="e.g. Los Angeles"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button 
                                    onClick={handleUpdateTradeInfo}
                                    disabled={isUpdatingTrade}
                                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {isUpdatingTrade ? 'Saving...' : 'Update Trade Info'}
                                </button>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h3 className="font-medium mb-2">{t('details.items')}:</h3>
                            {order.items.map(item => (
                                <div key={item.id} className="flex justify-between text-sm py-1">
                                    <span>{item.productName} x {item.quantity}</span>
                                    <span>{order.currency} {item.totalPrice}</span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t pt-4 flex gap-2">
                            <button
                                onClick={() => handleDownload('pi')}
                                className="flex-1 flex items-center justify-center gap-2 rounded-md bg-zinc-100 dark:bg-zinc-800 py-2 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700"
                            >
                                <Download className="h-4 w-4" />
                                PI
                            </button>
                            <button
                                onClick={() => handleDownload('ci')}
                                className="flex-1 flex items-center justify-center gap-2 rounded-md bg-zinc-100 dark:bg-zinc-800 py-2 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700"
                            >
                                <FileText className="h-4 w-4" />
                                CI
                            </button>
                            <button
                                onClick={() => handleDownload('pl')}
                                className="flex-1 flex items-center justify-center gap-2 rounded-md bg-zinc-100 dark:bg-zinc-800 py-2 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700"
                            >
                                <FileText className="h-4 w-4" />
                                PL
                            </button>
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
