'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslations } from 'next-intl';
import { InquiryChat } from '@/components/inquiry/InquiryChat';

interface InquiryItem {
  id: string;
  productId: string;
  skuId: string;
  productName: string;
  quantity: number;
  targetPrice: string;
  quotedPrice?: string;
  skuSpecs?: string;
}

interface Inquiry {
  id: string;
  inquiryNo: string;
  status: string;
  contactName: string;
  contactEmail: string;
  items: InquiryItem[];
}

export default function AdminInquiryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuthStore();
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [quotes, setQuotes] = useState<Record<string, string>>({});
  const t = useTranslations('Admin');

  useEffect(() => {
    fetch(`http://localhost:3001/inquiries/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
          setInquiry(data);
          // Initialize quotes
          const initialQuotes: Record<string, string> = {};
          data.items.forEach((item: InquiryItem) => {
              if (item.quotedPrice) initialQuotes[item.id] = item.quotedPrice;
          });
          setQuotes(initialQuotes);
      })
      .catch(console.error);
  }, [id, token]);

  const handleQuoteChange = (itemId: string, val: string) => {
      setQuotes(prev => ({ ...prev, [itemId]: val }));
  };

  const handleSubmitQuote = async () => {
      if (!inquiry) return;
      
      const updatedItems = inquiry.items.map(item => ({
          productId: item.productId,
          skuId: item.skuId,
          productName: item.productName,
          skuSpecs: item.skuSpecs,
          quantity: item.quantity,
          price: item.targetPrice,
          quotedPrice: quotes[item.id] ? Number(quotes[item.id]) : Number(item.quotedPrice || 0)
      }));

      try {
        const res = await fetch(`http://localhost:3001/inquiries/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                status: 'QUOTED',
                items: updatedItems
            })
        });
        
        if (res.ok) {
            alert(t('alerts.quotedSuccess'));
            router.refresh();
            router.push('/admin/inquiries');
        } else {
             const err = await res.json();
             alert(t('alerts.error') + ': ' + JSON.stringify(err));
        }
      } catch (e) {
          console.error(e);
          alert(t('alerts.error'));
      }
  };

  if (!inquiry) return <div>{t('loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('details.quoteInquiry')}: {inquiry.inquiryNo}</h1>
        <div className="space-x-2">
            <button onClick={handleSubmitQuote} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                {t('details.submitQuote')}
            </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded border">
          <h2 className="text-xl font-semibold mb-4">{t('details.customerInfo')}</h2>
          <p>{t('details.name')}: {inquiry.contactName}</p>
          <p>{t('details.email')}: {inquiry.contactEmail}</p>
      </div>

      <div className="bg-white p-6 rounded border">
          <h2 className="text-xl font-semibold mb-4">{t('details.items')}</h2>
          <table className="w-full">
              <thead>
                  <tr className="border-b text-left">
                      <th className="py-2">{t('details.product')}</th>
                      <th className="py-2">{t('details.qty')}</th>
                      <th className="py-2">{t('details.targetPrice')}</th>
                      <th className="py-2">{t('details.quotedPrice')}</th>
                  </tr>
              </thead>
              <tbody>
                  {inquiry.items.map(item => (
                      <tr key={item.id} className="border-b">
                          <td className="py-2">
                              {item.productName}
                              <div className="text-xs text-gray-500">{item.skuSpecs}</div>
                          </td>
                          <td className="py-2">{item.quantity}</td>
                          <td className="py-2">{item.targetPrice}</td>
                          <td className="py-2">
                              <input 
                                type="number" 
                                className="border p-1 rounded w-32"
                                value={quotes[item.id] || ''}
                                onChange={(e) => handleQuoteChange(item.id, e.target.value)}
                                placeholder={t('details.enterPrice')}
                              />
                              <button 
                                className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
                                onClick={async () => {
                                    // Single Item Update Logic (Ideally backend supports this)
                                    // Or we verify if PATCH inquiry supports nested update.
                                    // For now, just logging.
                                    alert(`Price ${quotes[item.id]} saved locally (Submit logic pending backend check)`);
                                }}
                              >
                                  {t('details.save')}
                              </button>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>

      <div className="bg-white p-6 rounded border">
         <InquiryChat inquiryId={id as string} />
      </div>
    </div>
  );
}
