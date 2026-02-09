'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Plus, Pencil, Trash2, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';

interface Sku {
  id: string;
  skuCode: string;
  stock: number;
}

interface Category {
  id: string;
  name: string; // JSON
}

interface Product {
  id: string;
  title: string; // JSON string
  basePrice: number;
  isPublished: boolean;
  createdAt: string;
  skus: Sku[];
  images: string; // JSON string
  category?: Category;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuthStore();
  const t = useTranslations('Admin');

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/products?sort=createdAt&order=desc&page=${page}&limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      
      // Handle response structure change (array vs { items, total })
      if (Array.isArray(data)) {
         setProducts(data);
         setTotal(data.length);
      } else {
         setProducts(data.items || []);
         setTotal(data.total || 0);
      }
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
        fetchProducts();
    }
  }, [token, page]);

  const totalPages = Math.ceil(total / limit);

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('deleteConfirm'))) return;
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error(t('deleteError'));
      setProducts(products.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const parseJson = (jsonStr: string) => {
    try {
      return JSON.parse(jsonStr);
    } catch {
      return {};
    }
  };
  
  const parseJsonArray = (jsonStr: string) => {
    try {
      const arr = JSON.parse(jsonStr);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  };

  if (isLoading) return <div>{t('loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('productTitle')}</h2>
          <p className="text-zinc-500">{t('productSubtitle')}</p>
        </div>
        <Link 
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          {t('actions.addProduct')}
        </Link>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-3 font-medium text-zinc-500">{t('table.product')}</th>
              <th className="px-6 py-3 font-medium text-zinc-500">{t('table.category')}</th>
              <th className="px-6 py-3 font-medium text-zinc-500">{t('table.skus')}</th>
              <th className="px-6 py-3 font-medium text-zinc-500">{t('table.basePrice')}</th>
              <th className="px-6 py-3 font-medium text-zinc-500">{t('table.status')}</th>
              <th className="px-6 py-3 font-medium text-zinc-500">{t('table.created')}</th>
              <th className="px-6 py-3 font-medium text-zinc-500 text-right">{t('table.action')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {products.length === 0 && (
                <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                        {t('noProducts')}
                    </td>
                </tr>
            )}
            {products.map((product) => {
              const title = parseJson(product.title);
              const images = parseJsonArray(product.images);
              const totalStock = product.skus.reduce((sum, sku) => sum + sku.stock, 0);
              const categoryName = product.category ? parseJson(product.category.name).en : t('common.uncategorized');

              return (
                <tr key={product.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-md flex items-center justify-center overflow-hidden shrink-0">
                         {images[0] ? (
                            <img src={images[0]} alt="Product" className="w-full h-full object-cover" />
                         ) : (
                            <Package className="w-6 h-6 text-zinc-300" />
                         )}
                      </div>
                      <div>
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">{title.en || t('common.untitled')}</div>
                        <div className="text-xs text-zinc-500">{title.zh}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-500">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      {categoryName}
                    </span>
                    {product.category && (
                        <div className="text-[10px] text-zinc-400 mt-1 select-all cursor-copy" title="Click to copy ID" onClick={() => navigator.clipboard.writeText(product.category!.id)}>
                            ID: {product.category.id.substring(0, 8)}...
                        </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-zinc-500">
                    <div className="flex flex-col">
                        <span>{product.skus.length} {t('common.variants')}</span>
                        <span className="text-xs">{t('common.stock')}: {totalStock}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">${Number(product.basePrice).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.isPublished 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        product.isPublished ? 'bg-emerald-500' : 'bg-zinc-500'
                      }`} />
                      {product.isPublished ? t('status.PUBLISHED') : t('status.DRAFT')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-500">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link 
                        href={`/admin/products/${product.id}`}
                        className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-zinc-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {/* Pagination Controls */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="text-sm text-zinc-500">
                Showing {products.length} of {total} products
            </div>
            <div className="flex gap-2">
                <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 border border-zinc-200 dark:border-zinc-700 rounded-md disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 text-sm font-medium">
                    Page {page} of {Math.max(1, totalPages)}
                </span>
                <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-2 border border-zinc-200 dark:border-zinc-700 rounded-md disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
