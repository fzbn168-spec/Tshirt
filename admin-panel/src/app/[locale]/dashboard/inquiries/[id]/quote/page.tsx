'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/navigation';
import { useParams } from 'next/navigation';
import api from '@/lib/axios';
import { Loader2, ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface InquiryItem {
  id: string;
  productId: string;
  skuId?: string;
  productName: string;
  skuSpecs?: string;
  quantity: number;
  targetPrice: number;
  quotedPrice?: number;
  paymentTerms?: string;
  quoteValidUntil?: string;
}

interface Inquiry {
  id: string;
  inquiryNo: string;
  status: string;
  type: string;
  items: InquiryItem[];
}

export default function InquiryQuotePage() {
  const t = useTranslations('Admin');
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [items, setItems] = useState<InquiryItem[]>([]);
  const [message, setMessage] = useState('');
  const [quoteTerms, setQuoteTerms] = useState('');
  const [quoteValidUntil, setQuoteValidUntil] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const res = await api.get(`/platform/inquiries/${id}`);
        const data = res.data as any;
        const normalizedItems: InquiryItem[] = (data.items || []).map(
          (item: any) => ({
            id: item.id,
            productId: item.productId,
            skuId: item.skuId || undefined,
            productName: item.productName,
            skuSpecs: item.skuSpecs || '',
            quantity: Number(item.quantity) || 0,
            targetPrice: Number(item.targetPrice) || 0,
            quotedPrice:
              item.quotedPrice !== null && item.quotedPrice !== undefined
                ? Number(item.quotedPrice)
                : undefined,
            paymentTerms: item.paymentTerms || undefined,
            quoteValidUntil: item.quoteValidUntil
              ? new Date(item.quoteValidUntil).toISOString().split('T')[0]
              : undefined,
          }),
        );
        setInquiry({
          id: data.id,
          inquiryNo: data.inquiryNo,
          status: data.status,
          type: data.type,
          items: normalizedItems,
        });
        setItems(normalizedItems);
        const firstWithTerms = normalizedItems.find((i) => i.paymentTerms);
        const firstWithValid = normalizedItems.find((i) => i.quoteValidUntil);
        setQuoteTerms(firstWithTerms?.paymentTerms || '');
        setQuoteValidUntil(firstWithValid?.quoteValidUntil || '');
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to load inquiry');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const updateQuotedPrice = (itemId: string, value: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quotedPrice:
                value === '' ? undefined : Number.isNaN(Number(value)) ? item.quotedPrice : Number(value),
            }
          : item,
      ),
    );
  };

  const handleSubmit = async () => {
    if (!inquiry) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        status: 'QUOTED',
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          skuId: item.skuId,
          skuSpecs: item.skuSpecs,
          quantity: item.quantity,
          price: item.targetPrice,
          quotedPrice:
            item.quotedPrice !== undefined ? item.quotedPrice : item.targetPrice,
          paymentTerms: quoteTerms || undefined,
          quoteValidUntil: quoteValidUntil || undefined,
        })),
      };
      await api.patch(`/platform/inquiries/${inquiry.id}`, payload);
      if (message.trim()) {
        await api.post(`/inquiries/${inquiry.id}/messages`, {
          content: message.trim(),
        });
      }
      router.push(`/dashboard/inquiries/${inquiry.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to submit quote');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="p-8 text-center text-sm text-red-500">
        {error || 'Inquiry not found'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">
          {inquiry.inquiryNo}
        </h1>
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

      {error && (
        <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-between">
              <h2 className="font-semibold text-sm">
                {t('details.items')}
              </h2>
              <span className="text-xs text-zinc-500">
                Edit quoted price for each line
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-zinc-500 border-b bg-zinc-50 dark:bg-zinc-800/50">
                  <tr>
                    <th className="text-left px-6 py-2">Product</th>
                    <th className="text-right px-4 py-2">Qty</th>
                    <th className="text-right px-4 py-2">Target Price</th>
                    <th className="text-right px-6 py-2">Quoted Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      <td className="px-6 py-3">
                        <div className="font-medium">{item.productName}</div>
                        {item.skuSpecs && (
                          <div className="text-xs text-zinc-500">
                            {item.skuSpecs}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right">
                        ${item.targetPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-zinc-400">$</span>
                          <Input
                            type="number"
                            inputMode="decimal"
                            className="w-24 h-8 text-right"
                            value={
                              item.quotedPrice !== undefined
                                ? String(item.quotedPrice)
                                : ''
                            }
                            placeholder={item.targetPrice.toFixed(2)}
                            onChange={(e) =>
                              updateQuotedPrice(item.id, e.target.value)
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold text-sm">
              Quote Summary
            </h3>
            <div className="text-sm text-zinc-500 space-y-1">
              <p>
                Current status:{' '}
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {inquiry.status}
                </span>
              </p>
              <p>
                After submitting, status will change to{' '}
                <span className="font-semibold text-green-600">QUOTED</span>.
              </p>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Message to customer
              </label>
              <textarea
                className="flex w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300 min-h-[100px]"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Explain your pricing, MOQ, lead time, etc. This will be visible to the buyer."
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Quote description / terms
              </label>
              <textarea
                className="flex w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300 min-h-[80px]"
                value={quoteTerms}
                onChange={(e) => setQuoteTerms(e.target.value)}
                placeholder="Payment terms, validity, shipping terms, etc."
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Quote valid until
              </label>
              <Input
                type="date"
                value={quoteValidUntil}
                onChange={(e) => setQuoteValidUntil(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              <Send className="h-4 w-4 mr-2" />
              Send Quote
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
