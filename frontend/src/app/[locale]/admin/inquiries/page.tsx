'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslations } from 'next-intl';

interface Inquiry {
  id: string;
  inquiryNo: string;
  status: string;
  createdAt: string;
  contactName: string;
  company?: { name: string };
}

export default function AdminInquiriesPage() {
  const { token } = useAuthStore();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const t = useTranslations('Admin');

  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        // Use Admin endpoint
        const res = await fetch(`${API_URL}/platform/inquiries`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setInquiries(Array.isArray(data) ? data : data.data || []);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchInquiries();
  }, [token]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('inquiryListTitle')}</h1>
      <div className="rounded-md border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b">
            <tr>
              <th className="h-12 px-4 text-left font-medium">{t('table.inquiryNo')}</th>
              <th className="h-12 px-4 text-left font-medium">{t('table.date')}</th>
              <th className="h-12 px-4 text-left font-medium">{t('table.customer')}</th>
              <th className="h-12 px-4 text-left font-medium">{t('table.status')}</th>
              <th className="h-12 px-4 text-left font-medium">{t('table.action')}</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.map((inquiry) => (
              <tr key={inquiry.id} className="border-b hover:bg-zinc-50">
                <td className="p-4">{inquiry.inquiryNo}</td>
                <td className="p-4">{new Date(inquiry.createdAt).toLocaleDateString()}</td>
                <td className="p-4">
                    {inquiry.contactName}
                    {inquiry.company && <div className="text-xs text-zinc-500">{inquiry.company.name}</div>}
                </td>
                <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        inquiry.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        inquiry.status === 'QUOTED' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                        {t(`status.${inquiry.status}`)}
                    </span>
                </td>
                <td className="p-4">
                  <Link href={`/admin/inquiries/${inquiry.id}`} className="text-blue-600 hover:underline">
                    {t('actions.manageQuote')}
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
