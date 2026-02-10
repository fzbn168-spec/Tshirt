
'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/navigation';
import { Loader2, Package, Lock } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCurrencyStore } from '@/store/useCurrencyStore';

interface Product {
  id: string;
  title: string; // JSON
  description: string; // JSON
  basePrice: string; // Decimal string
  images: string; // JSON array
  moq: number;
  category: { id: string; name: string };
  skus: any[];
}

export function ProductGrid() {
  const searchParams = useSearchParams();
  // Using process.env.NEXT_PUBLIC_API_URL is handled by build time replacement in production
  // But we provide a fallback for local dev if env is missing
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  // Construct query string
  const queryString = searchParams.toString();

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', queryString],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/products?${queryString}`);
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    }
  });

  const products = data ? (Array.isArray(data) ? data : (data.items || [])) : [];

  // Client-side auth check
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isAuth = isAuthenticated();
  const { format } = useCurrencyStore();

  const parseJson = (str: any) => {
    if (typeof str !== 'string') return '';
    try {
      const obj = JSON.parse(str);
      return obj.en || obj.zh || str;
    } catch {
      return str;
    }
  };

  const getFirstImage = (jsonStr: any) => {
    if (typeof jsonStr !== 'string') return null;
    try {
      const arr = JSON.parse(jsonStr);
      return Array.isArray(arr) && arr.length > 0 ? arr[0] : null;
    } catch {
      return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500 bg-red-50 dark:bg-red-900/10 rounded-lg">
        Failed to load products. Please try again later.
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-24 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800">
        <Package className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
        <p className="text-zinc-500">No products found matching your criteria.</p>
        <button 
          onClick={() => window.location.href = '/products'}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          Clear Filters
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-12">
      {products.map((product: Product) => {
        const imageUrl = getFirstImage(product.images);
        const title = parseJson(product.title);
        
        return (
          <Link 
            key={product.id} 
            href={`/product/${product.id}`}
            className="group block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:shadow-xl hover:border-blue-500/30 transition-all duration-300 transform hover:-translate-y-1"
          >
            {/* Image Container */}
            <div className="aspect-[4/5] bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50">
                  <Package className="w-16 h-16 opacity-50" />
                </div>
              )}
              
              {/* Overlay / Quick Action (Optional) */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
            </div>

            <div className="p-5">
              <h3 className="font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2 mb-3 h-12 leading-snug group-hover:text-blue-600 transition-colors">
                {title}
              </h3>
              
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-zinc-500 mb-0.5 font-medium uppercase tracking-wider">Price</p>
                  {isAuth ? (
                    <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                      {format(Number(product.basePrice))}
                    </p>
                  ) : (
                    <div className="flex items-center gap-1 text-zinc-500">
                      <Lock className="w-3 h-3" />
                      <span className="text-sm font-medium">Login to view</span>
                    </div>
                  )}
                </div>
                {product.moq && (
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                      MOQ: {product.moq}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
