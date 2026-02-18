'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { 
  ArrowLeft, 
  Loader2, 
  Calendar, 
  User, 
  Mail, 
  FileText, 
  Clock,
  AlertCircle,
  FileDown
} from 'lucide-react';
import Link from 'next/link';
import { InquiryChat } from '@/components/inquiry/InquiryChat';
import api from '@/lib/api';

interface InquiryItem {
  id: string;
  productName: string;
  skuSpecs?: string;
  quantity: number;
  targetPrice?: number;
  quotedPrice?: number;
}

interface Inquiry {
  id: string;
  inquiryNo: string;
  contactName: string;
  contactEmail: string;
  notes?: string;
  status: string;
  type: string;
  createdAt: string;
  items: InquiryItem[];
  company?: {
      name: string;
  };
}

export default function InquiryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuthStore();
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    api.get(`/inquiries/${params.id}`)
      .then(res => {
        setInquiry(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [params.id, token]);

  const downloadPdf = async () => {
    if (!inquiry) return;
    try {
        const res = await api.get(`/inquiries/${params.id}/pdf`, { responseType: 'blob' });
        const blob = res.data as Blob;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Inquiry-${inquiry.inquiryNo}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
    } catch {
        alert('Failed to download PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="p-4 rounded-full bg-red-100 text-red-600 dark:bg-red-900/20">
            <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-medium">Failed to load inquiry</h3>
        <p className="text-zinc-500">{error}</p>
        <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-zinc-900 text-white rounded-md hover:bg-zinc-800"
        >
            Go Back
        </button>
      </div>
    );
  }

  if (!inquiry) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'QUOTED': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'ORDERED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'CLOSED': return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/inquiries"
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              {inquiry.inquiryNo}
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                {inquiry.status}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${inquiry.type === 'SAMPLE' ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800' : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'}`}>
                {inquiry.type || 'STANDARD'}
              </span>
            </h1>
            <p className="text-sm text-zinc-500 mt-1 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              Created on {new Date(inquiry.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
            <button 
                onClick={downloadPdf}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm font-medium hover:bg-zinc-50"
            >
                <FileDown className="w-4 h-4" />
                Download PDF
            </button>
            {inquiry.status === 'QUOTED' && (
                <button 
                    onClick={() => router.push(`/dashboard/orders/create?inquiryId=${inquiry.id}`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 shadow-sm transition-colors"
                >
                    Place Order
                </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
            {/* Items Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50">
                    <h2 className="font-semibold flex items-center gap-2">
                        <FileText className="w-4 h-4 text-zinc-500" />
                        Inquiry Items
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-zinc-500 font-medium bg-zinc-50 dark:bg-zinc-800/30">
                            <tr>
                                <th className="px-6 py-3">Product</th>
                                <th className="px-6 py-3">Specs</th>
                                <th className="px-6 py-3 text-right">Qty</th>
                                <th className="px-6 py-3 text-right">Target Price</th>
                                <th className="px-6 py-3 text-right">Quoted Price</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {inquiry.items.map(item => (
                                <tr key={item.id} className="hover:bg-zinc-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium">{item.productName}</td>
                                    <td className="px-6 py-4 text-zinc-500">{item.skuSpecs || '-'}</td>
                                    <td className="px-6 py-4 text-right">{item.quantity}</td>
                                    <td className="px-6 py-4 text-right text-zinc-500">
                                        {item.targetPrice ? `$${Number(item.targetPrice).toFixed(2)}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium">
                                        {item.quotedPrice ? (
                                            <span className="text-green-600 dark:text-green-400">
                                                ${Number(item.quotedPrice).toFixed(2)}
                                            </span>
                                        ) : (
                                            <span className="text-zinc-400 italic">Pending</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Notes Card */}
            {inquiry.notes && (
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                    <h3 className="font-medium mb-2 text-zinc-900 dark:text-zinc-100">Notes</h3>
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm whitespace-pre-wrap">
                        {inquiry.notes}
                    </p>
                </div>
            )}
        </div>

        {/* Chat Section */}
        <div className="md:col-span-2">
            <InquiryChat inquiryId={params.id as string} />
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
                <h3 className="font-medium border-b border-zinc-100 dark:border-zinc-800 pb-2 mb-4">Contact Info</h3>
                
                <div className="flex items-start gap-3">
                    <User className="w-4 h-4 text-zinc-400 mt-1" />
                    <div>
                        <div className="text-sm font-medium">{inquiry.contactName}</div>
                        <div className="text-xs text-zinc-500">Contact Person</div>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-zinc-400 mt-1" />
                    <div>
                        <div className="text-sm font-medium">{inquiry.contactEmail}</div>
                        <div className="text-xs text-zinc-500">Email Address</div>
                    </div>
                </div>

                {inquiry.company && (
                    <div className="flex items-start gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="w-4 h-4 rounded bg-blue-100 flex items-center justify-center mt-1">
                            <span className="text-[10px] font-bold text-blue-600">C</span>
                        </div>
                        <div>
                            <div className="text-sm font-medium">{inquiry.company.name}</div>
                            <div className="text-xs text-zinc-500">Company</div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-900/20">
                <div className="flex gap-3">
                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Status: {inquiry.status}</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                            {inquiry.status === 'PENDING' && 'Waiting for admin to review and quote.'}
                            {inquiry.status === 'QUOTED' && 'Quote received. You can now place an order.'}
                            {inquiry.status === 'ORDERED' && 'Order has been placed for this inquiry.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
