'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Ruler, Truck, FileText, Star } from 'lucide-react';

interface ProductTabsProps {
  description: string;
}

export function ProductTabs({ description }: ProductTabsProps) {
  const t = useTranslations('Product');
  const [activeTab, setActiveTab] = useState<'details' | 'size' | 'shipping' | 'reviews'>('details');

  // Helper to parse JSON strings
  const parseDescription = (str: string) => {
    try {
      const obj = JSON.parse(str || '{}');
      return obj.en || obj.zh || str;
    } catch {
      return str;
    }
  };

  const displayDescription = parseDescription(description);

  const tabs = [
    { id: 'details', label: t('tabs.details'), icon: FileText },
    { id: 'size', label: t('tabs.sizeGuide'), icon: Ruler },
    { id: 'shipping', label: t('tabs.shipping'), icon: Truck },
    { id: 'reviews', label: t('tabs.reviews'), icon: Star },
  ];

  return (
    <div className="mt-12 lg:mt-16">
      {/* Tab Navigation */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:text-zinc-400 dark:hover:text-zinc-200"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="py-8">
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="prose prose-zinc dark:prose-invert max-w-none">
            <p className="whitespace-pre-line">{displayDescription}</p>
          </div>
        )}

        {/* Size Guide Tab */}
        {activeTab === 'size' && (
          <div className="max-w-2xl">
            <h3 className="text-lg font-bold mb-4">{t('sizeGuide.title')}</h3>
            <p className="text-zinc-500 mb-6 text-sm">{t('sizeGuide.note')}</p>
            
            <div className="overflow-hidden border border-zinc-200 dark:border-zinc-800 rounded-lg">
              <table className="w-full text-sm text-left">
                <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-medium">
                  <tr>
                    <th className="px-6 py-3">{t('sizeGuide.size')}</th>
                    <th className="px-6 py-3">{t('sizeGuide.chest')} (cm)</th>
                    <th className="px-6 py-3">{t('sizeGuide.length')} (cm)</th>
                    <th className="px-6 py-3">{t('sizeGuide.shoulder')} (cm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {['S', 'M', 'L', 'XL', '2XL'].map((size, i) => (
                    <tr key={size} className="bg-white dark:bg-zinc-950">
                      <td className="px-6 py-3 font-medium">{size}</td>
                      <td className="px-6 py-3">{90 + i * 4}</td>
                      <td className="px-6 py-3">{65 + i * 2}</td>
                      <td className="px-6 py-3">{40 + i * 2}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Shipping Tab */}
        {activeTab === 'shipping' && (
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl">
            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" />
                {t('shippingInfo.methods')}
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4">
                {t('shippingInfo.methodsDesc')}
              </p>
              
              <h4 className="font-medium text-sm mb-2 text-zinc-900 dark:text-zinc-100">{t('shippingInfo.processing')}</h4>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                {t('shippingInfo.processingTime')}
              </p>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                {t('shippingInfo.payment')}
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                {t('shippingInfo.paymentDesc')}
              </p>
            </div>
          </div>
        )}

        {/* Reviews Tab (Placeholder) */}
        {activeTab === 'reviews' && (
          <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900/30 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700">
            <Star className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
            <p className="text-zinc-500">Reviews are coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
