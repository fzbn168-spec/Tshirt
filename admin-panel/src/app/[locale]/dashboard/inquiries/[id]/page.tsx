'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from '@/navigation';
import api from '@/lib/axios';
import { useTranslations } from 'next-intl';
import { Loader2, ArrowLeft, Send, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/button';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';

interface InquiryItem {
  id: string;
  productName: string;
  skuSpecs: string;
  quantity: number;
  targetPrice: number;
  quotedPrice?: number;
  paymentTerms?: string;
  quoteValidUntil?: string;
}

interface InquiryMessage {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    fullName: string | null;
    role: string;
  };
}

interface Inquiry {
  id: string;
  inquiryNo: string;
  contactName: string;
  contactEmail: string;
  status: string;
  type: string;
  notes?: string;
  createdAt: string;
  items: InquiryItem[];
  company?: {
    name: string;
  };
}

export default function InquiryDetailPage() {
  const t = useTranslations('Admin');
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: inquiry, isLoading } = useQuery({
    queryKey: ['inquiry', id],
    queryFn: async () => {
      const res = await api.get(`/platform/inquiries/${id}`);
      return res.data as Inquiry;
    },
    enabled: !!id,
  });

  const { data: messages, isLoading: isMessagesLoading } = useQuery({
    queryKey: ['inquiry-messages', id],
    queryFn: async () => {
      const res = await api.get(`/inquiries/${id}/messages`);
      return res.data as InquiryMessage[];
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!inquiry) return null;

  const termsItem = inquiry.items.find((item) => item.paymentTerms);
  const validUntilItem = inquiry.items.find((item) => item.quoteValidUntil);
  const paymentTerms = termsItem?.paymentTerms;
  const quoteValidUntil = validUntilItem?.quoteValidUntil;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">{inquiry.inquiryNo}</h1>
        <span
          className={cn(
            'px-3 py-1 rounded-full text-xs font-bold border',
            inquiry.type === 'SAMPLE'
              ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800'
              : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
          )}
        >
          {inquiry.type || 'STANDARD'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <h2 className="font-semibold mb-4">{t('details.items')}</h2>
            <table className="w-full text-sm">
              <thead className="text-zinc-500 border-b">
                <tr>
                  <th className="text-left py-2">Product</th>
                  <th className="text-right py-2">Qty</th>
                  <th className="text-right py-2">Target Price</th>
                  <th className="text-right py-2">Quoted</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {inquiry.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3">
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-xs text-zinc-500">{item.skuSpecs}</div>
                    </td>
                    <td className="text-right py-3">{item.quantity}</td>
                    <td className="text-right py-3">${item.targetPrice}</td>
                    <td className="text-right py-3">
                      {item.quotedPrice ? `$${item.quotedPrice}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {inquiry.status === 'QUOTED' && (paymentTerms || quoteValidUntil) && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 space-y-3">
              <h2 className="font-semibold mb-2">Quote Details</h2>
              {paymentTerms && (
                <div className="text-sm">
                  <div className="text-zinc-500 mb-1">Description / Terms</div>
                  <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                    {paymentTerms}
                  </p>
                </div>
              )}
              {quoteValidUntil && (
                <div className="text-sm">
                  <div className="text-zinc-500 mb-1">Valid Until</div>
                  <p className="text-zinc-700 dark:text-zinc-300">
                    {new Date(quoteValidUntil).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <h2 className="font-semibold mb-4">Messages</h2>
            {isMessagesLoading && (
              <div className="flex h-24 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
              </div>
            )}
            {!isMessagesLoading && (!messages || messages.length === 0) && (
              <div className="text-sm text-zinc-500">No messages yet.</div>
            )}
            {!isMessagesLoading && messages && messages.length > 0 && (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="rounded-md border border-zinc-200 dark:border-zinc-800 p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium">
                        {msg.sender.fullName || 'User'} ({msg.sender.role})
                      </div>
                      <div className="text-xs text-zinc-500">
                        {new Date(msg.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <h2 className="font-semibold mb-4">{t('details.customerInfo')}</h2>
            <div className="space-y-4 text-sm">
              <div>
                <div className="text-zinc-500">Contact</div>
                <div className="font-medium">{inquiry.contactName}</div>
                <div className="text-blue-600">{inquiry.contactEmail}</div>
              </div>
              {inquiry.company && (
                <div>
                  <div className="text-zinc-500">Company</div>
                  <div className="font-medium">{inquiry.company.name}</div>
                </div>
              )}
              {inquiry.notes && (
                <div>
                  <div className="text-zinc-500">Notes</div>
                  <div className="text-zinc-700 bg-zinc-50 p-2 rounded mt-1">
                    {inquiry.notes}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 space-y-3">
            <h2 className="font-semibold mb-4">Actions</h2>
            {inquiry.status === 'PENDING' && (
              <Button
                className="w-full"
                onClick={() => router.push(`/dashboard/inquiries/${id}/quote`)}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Quote
              </Button>
            )}
            {inquiry.status === 'QUOTED' && (
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => router.push(`/dashboard/orders/create?inquiryId=${id}`)}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Create Order
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
