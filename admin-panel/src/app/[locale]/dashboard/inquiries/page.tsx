'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from '@/navigation';
import api from '@/lib/axios';
import { useTranslations } from 'next-intl';
import { Loader2, FileText, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/button';

interface Inquiry {
  id: string;
  inquiryNo: string;
  contactName: string;
  contactEmail: string;
  status: string;
  type: string;
  createdAt: string;
  company?: {
    name: string;
  };
}

export default function InquiriesPage() {
  const t = useTranslations('Admin');
  const router = useRouter();

  const { data: inquiries, isLoading } = useQuery({
    queryKey: ['inquiries'],
    queryFn: async () => {
      const res = await api.get('/platform/inquiries');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            {t('inquiryListTitle')}
          </h1>
          <p className="text-zinc-500">{t('inquiryDesc')}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{t('table.inquiryNo')}</th>
              <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{t('table.type')}</th>
              <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{t('table.customer')}</th>
              <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{t('table.date')}</th>
              <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{t('table.status')}</th>
              <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100 text-right">{t('table.action')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {inquiries?.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                  No inquiries found.
                </td>
              </tr>
            ) : (
              inquiries?.map((inquiry: Inquiry) => (
                <tr key={inquiry.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{inquiry.inquiryNo}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border",
                      inquiry.type === 'SAMPLE' 
                        ? "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800" 
                        : "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                    )}>
                      {inquiry.type || 'STANDARD'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{inquiry.contactName}</div>
                    <div className="text-xs text-zinc-500">{inquiry.company?.name || inquiry.contactEmail}</div>
                  </td>
                  <td className="px-6 py-4 text-zinc-500">
                    {new Date(inquiry.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                      inquiry.status === 'PENDING' ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                      inquiry.status === 'QUOTED' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                      "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                    )}>
                      {t(`status.${inquiry.status}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => router.push(`/dashboard/inquiries/${inquiry.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
