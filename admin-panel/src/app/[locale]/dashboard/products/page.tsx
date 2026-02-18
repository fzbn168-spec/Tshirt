'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@/navigation';
import api from '@/lib/axios';
import { Button } from '@/components/button';
import { Plus, Edit, Trash2, Loader2, Package, Upload } from 'lucide-react';
import { useState } from 'react';
import { useToastStore } from '@/store/useToastStore';
import { useTranslations } from 'next-intl';
import ImportProductsModal from '@/components/products/ImportProductsModal';

interface Product {
  id: string;
  title: string; // JSON
  basePrice: string;
  categoryId: string;
  createdAt: string;
  skus: any[];
  sizeChart?: {
    name: string;
  };
}

export default function ProductsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations('Admin.productList');
  const { addToast } = useToastStore();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/products');
      return res.data; // { total, items }
    },
  });

  const products = data?.items || [];

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      addToast(t('deleteSuccess'), 'success');
    },
    onError: () => {
      addToast(t('deleteError'), 'error');
    },
  });

  const handleDelete = (id: string) => {
    if (confirm(t('deleteConfirm'))) {
      deleteMutation.mutate(id);
    }
  };

  const getTitle = (p: Product) => {
    try {
      return p.title ? JSON.parse(p.title).en : 'Untitled';
    } catch {
      return p.title || 'Untitled';
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        {t('loadError')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            {t('title')}
          </h1>
          <p className="text-zinc-500">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowImport(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import Excel
          </Button>
          <Button onClick={() => router.push('/dashboard/products/new')}>
            <Plus className="h-4 w-4 mr-2" />
            {t('create')}
          </Button>
        </div>
      </div>

      <ImportProductsModal 
        isOpen={showImport} 
        onClose={() => setShowImport(false)} 
        onSuccess={() => {
          setShowImport(false);
          queryClient.invalidateQueries({ queryKey: ['products'] });
        }} 
      />

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{t('headers.name')}</th>
              <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{t('headers.sizeChart')}</th>
              <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{t('headers.skus')}</th>
              <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{t('headers.basePrice')}</th>
              <th className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100 text-right">{t('headers.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                  {t('noProducts')}
                </td>
              </tr>
            ) : (
              products.map((product: Product) => {
                return (
                  <tr key={product.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{getTitle(product)}</td>
                    <td className="px-6 py-4 text-zinc-500">
                      {product.sizeChart?.name ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          {product.sizeChart.name}
                        </span>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-zinc-500">{product.skus?.length || 0}</td>
                    <td className="px-6 py-4 text-zinc-500">${Number(product.basePrice).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => router.push(`/dashboard/products/${product.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
