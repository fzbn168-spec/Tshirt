'use client';

import { useQuery } from '@tanstack/react-query';
import { Link } from '@/navigation';
import { ArrowRight, Package } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Product {
  id: string;
  title: string;
  basePrice: string;
  images: string;
  moq: number;
  category?: { name: string };
}

export function FeaturedProducts() {
  const t = useTranslations('Home');
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/products?limit=4`);
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    }
  });

  const parseJson = (str: string) => {
    try {
      const obj = JSON.parse(str);
      return obj.en || obj.zh || str;
    } catch {
      return str;
    }
  };

  const getFirstImage = (jsonStr: string) => {
    try {
      const arr = JSON.parse(jsonStr);
      return Array.isArray(arr) && arr.length > 0 ? arr[0] : null;
    } catch {
      return null;
    }
  };

  if (isLoading) {
    return <div className="py-12 text-center text-zinc-500">Loading trending products...</div>;
  }

  if (!products || products.length === 0) {
    return <div className="py-12 text-center text-zinc-500">No products available at the moment.</div>;
  }

  // Take only first 4 items
  const featured = products.slice(0, 4);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {featured.map((product) => {
        const title = parseJson(product.title);
        const imageUrl = getFirstImage(product.images);
        const categoryName = product.category ? parseJson(product.category.name) : 'General';

        return (
          <Link 
            key={product.id} 
            href={`/product/${product.id}`}
            className="group bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-lg transition-shadow block"
          >
            <div className="aspect-square bg-zinc-100 relative overflow-hidden">
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-zinc-300">
                  <Package className="w-12 h-12 opacity-50" />
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="text-xs text-zinc-500 mb-1">{categoryName}</div>
              <h3 className="font-medium text-lg mb-2 line-clamp-1">{title}</h3>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-sm text-zinc-500">{t('moqLabel')}: {product.moq || 1} Pairs</div>
                  <div className="font-bold text-blue-600">${Number(product.basePrice).toFixed(2)}</div>
                </div>
                <div className="p-2 bg-zinc-100 rounded-full group-hover:bg-blue-50 text-blue-600 transition-colors">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
